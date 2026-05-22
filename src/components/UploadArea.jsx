import { useState, useCallback, useEffect } from 'react';
import { UploadCloud, X, GripVertical, Star } from 'lucide-react';
import { normalizeImageUrl } from '../utils/imageUtils';

export default function UploadArea({ images = [], onChange }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFiles = (files) => {
    if (!files || files.length === 0) return;
    
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
      isMain: images.length === 0 // first image becomes main automatically
    }));

    // Se já havia uma imagem principal, não definir a nova como principal, a menos que a lista estivesse vazia
    if (images.length > 0 && newImages.length > 0) {
      newImages[0].isMain = false; 
    }

    onChange([...images, ...newImages]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  }, [images, onChange]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeImage = (idToRemove) => {
    const updated = images.filter(img => img.id !== idToRemove);
    // Se removeu a principal, define a primeira como principal
    if (images.find(img => img.id === idToRemove)?.isMain && updated.length > 0) {
      updated[0].isMain = true;
    }
    onChange(updated);
  };

  const setMainImage = (idToMain) => {
    const updated = images.map(img => ({
      ...img,
      isMain: img.id === idToMain
    }));
    onChange(updated);
  };

  // Drag to reorder - simple implementation
  const moveImage = (dragIndex, hoverIndex) => {
    if (hoverIndex < 0 || hoverIndex >= images.length) return;
    const dragImage = images[dragIndex];
    const newImages = [...images];
    newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, dragImage);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div 
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          dragActive 
            ? 'border-[var(--color-primary)] bg-[rgba(255,43,6,0.05)]' 
            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[rgba(255,255,255,0.02)]'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="file-upload" 
          multiple 
          accept="image/*" 
          className="hidden" 
          onChange={handleChange} 
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[var(--color-primary)]">
            <UploadCloud size={32} />
          </div>
          <div>
            <p className="text-white font-medium mb-1">Clique para enviar ou arraste imagens aqui</p>
            <p className="text-[var(--color-text-muted)] text-sm">PNG, JPG, WEBP até 10MB</p>
          </div>
        </label>
      </div>

      {/* Galeria de Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img, index) => (
            <div 
              key={img.id} 
              className={`relative group aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                img.isMain ? 'border-[var(--color-primary)] glow-red' : 'border-[var(--color-border)]'
              }`}
            >
              <img
                src={normalizeImageUrl(img.preview || img.url)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                width="96"
                height="96"
              />
              
              {/* Overlays e Ações */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between items-start w-full">
                  <div className="flex gap-1">
                    {index > 0 && (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveImage(index, index - 1); }}
                        className="p-1 bg-black/80 hover:bg-zinc-700 text-white rounded transition-colors"
                        title="Mover para esquerda"
                      >
                        <span className="text-xs leading-none">◀</span>
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveImage(index, index + 1); }}
                        className="p-1 bg-black/80 hover:bg-zinc-700 text-white rounded transition-colors"
                        title="Mover para direita"
                      >
                        <span className="text-xs leading-none">▶</span>
                      </button>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="flex justify-center">
                  {!img.isMain && (
                    <button 
                      type="button"
                      onClick={() => setMainImage(img.id)}
                      className="px-3 py-1.5 bg-black/80 hover:bg-[var(--color-primary)] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Star size={12} /> Definir Principal
                    </button>
                  )}
                  {img.isMain && (
                    <span className="px-3 py-1 bg-[var(--color-primary)] text-white text-xs font-medium rounded-lg flex items-center gap-1">
                      <Star size={12} fill="currentColor" /> Principal
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

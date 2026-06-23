import { useState, useCallback, useEffect } from 'react';
import { UploadCloud, X, GripVertical, Star } from 'lucide-react';
import { normalizeImageUrl } from '../utils/imageUtils';
import { COLORS } from '../config/inventory';

export default function UploadArea({ images = [], onChange, maxImages = null }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [bulkColor, setBulkColor] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFiles = useCallback((files) => {
    if (!files || files.length === 0) return;
    
    let filesToProcess = Array.from(files);
    if (maxImages && images.length + filesToProcess.length > maxImages) {
      filesToProcess = filesToProcess.slice(0, maxImages - images.length);
    }

    const newImages = filesToProcess.map(file => {
      // Auto-detect color from filename (e.g. ze-pilintra-red-01.png)
      let autoColor = '';
      const nameParts = file.name.split('-');
      const colorCodes = ['red', 'blk', 'wht', 'gre', 'silv', 'off', 'blue', 'grn', 'brn', 'bge', 'yel'];
      for (const part of nameParts) {
        const cleanPart = part.split('.')[0].toLowerCase();
        if (colorCodes.includes(cleanPart)) {
          autoColor = cleanPart;
          break;
        }
      }

      const colorMeta = COLORS.find((c) => c.key === autoColor);
      return {
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
        isMain: images.length === 0, // first image becomes main automatically
        color_key: autoColor,
        color_variant: colorMeta?.label || '',
        position: images.length
      };
    });

    // Se já havia uma imagem principal, não definir a nova como principal, a menos que a lista estivesse vazia
    if (images.length > 0 && newImages.length > 0) {
      newImages.forEach(img => img.isMain = false);
    }

    onChange([...images, ...newImages]);
  }, [images, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

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

  const toggleSelectImage = (id) => {
    setSelectedImages(prev => 
      prev.includes(id) ? prev.filter(imgId => imgId !== id) : [...prev, id]
    );
  };

  const applyBulkColor = () => {
    if (!bulkColor || selectedImages.length === 0) return;
    const colorMeta = COLORS.find((c) => c.key === bulkColor);
    const updated = images.map(img => 
      selectedImages.includes(img.id)
        ? { ...img, color_key: bulkColor, color_variant: colorMeta?.label || '' }
        : img
    );
    onChange(updated);
    setSelectedImages([]); // clear selection after apply
    setBulkColor('');
  };

  const COLORS_OPTIONS = COLORS.map((c) => ({ label: c.label, value: c.key }));

  return (
    <div className="space-y-4">
      {/* Bulk Assign Bar */}
      {images.length > 0 && (
        <div className="flex items-center gap-4 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)]">
          <div className="text-sm text-white">
            <span className="font-bold">{selectedImages.length}</span> selecionadas
          </div>
          <select 
            value={bulkColor}
            onChange={e => setBulkColor(e.target.value)}
            disabled={selectedImages.length === 0}
            className="bg-[#0D0D0D] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
          >
            <option value="">Selecione uma cor...</option>
            {COLORS_OPTIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label} ({c.value})</option>
            ))}
          </select>
          <button 
            type="button"
            onClick={applyBulkColor}
            disabled={!bulkColor || selectedImages.length === 0}
            className="px-4 py-1.5 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            Aplicar Cor em Lote
          </button>
        </div>
      )}

      {/* Dropzone */}
      {(!maxImages || images.length < maxImages) && (
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
      )}

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

              {/* Color Badge */}
              {img.color_key && (
                <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">
                  {img.color_key}
                </div>
              )}

              {/* Checkbox for Bulk Select */}
              <div className="absolute top-2 right-2 z-10">
                <input 
                  type="checkbox"
                  checked={selectedImages.includes(img.id)}
                  onChange={() => toggleSelectImage(img.id)}
                  className="w-5 h-5 cursor-pointer accent-[var(--color-primary)]"
                />
              </div>
              
              {/* Overlays e Ações */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                <div className="flex justify-between items-start w-full pointer-events-auto absolute top-2 left-2 right-2">
                  <div className="flex gap-1 mt-8">
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
                    className="p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors mt-8"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="flex justify-center pointer-events-auto mb-2">
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

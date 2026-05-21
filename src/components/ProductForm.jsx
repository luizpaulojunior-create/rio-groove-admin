import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import UploadArea from './UploadArea';
import { collectionsService } from '../services/collections';

export default function ProductForm({ initialData, onSubmit, onCancel, isLoading }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: initialData || {
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      collection_id: '',
      category: '',
      price: ''
    }
  });

  const parseImages = (data) => {
    if (!data) return [];
    let rawImages = data.product_images || data.images || [];
    if (typeof rawImages === 'string') {
      try {
        rawImages = JSON.parse(rawImages);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(rawImages)) return [];

    return rawImages.map((img, idx) => {
      if (typeof img === 'string') {
        return {
          id: Math.random().toString(36).substring(7),
          url: img,
          preview: img,
          isMain: idx === 0
        };
      }
      return {
        id: img.id || Math.random().toString(36).substring(7),
        url: img.image_url || img.url || img.preview,
        preview: img.image_url || img.url || img.preview,
        isMain: img.isMain !== undefined ? img.isMain : idx === 0,
        ...img
      };
    });
  };

  const parseColors = (data) => {
    if (!data || !data.colors) return [];
    if (typeof data.colors === 'string') {
      try {
        const parsed = JSON.parse(data.colors);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(data.colors) ? data.colors : [];
  };

  const parseFabricAppearances = (data) => {
    const raw = data?.fabric_appearances || data?.fabricAppearances;
    if (!raw) return [];
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(raw) ? raw : [];
  };

  const [images, setImages] = useState(() => parseImages(initialData));
  const [imagesChanged, setImagesChanged] = useState(false);
  const [collections, setCollections] = useState([]);
  
  const COLORS_LIST = [
    'Preto', 'Branco', 'Vermelho', 'Azul', 'Verde',
    'Amarelo', 'Cinza', 'Rosa', 'Roxo'
  ];
  const [selectedColors, setSelectedColors] = useState(() => parseColors(initialData));
  const [selectedFabricAppearances, setSelectedFabricAppearances] = useState(() => parseFabricAppearances(initialData));

  useEffect(() => {
    collectionsService.getCollections().then(data => {
      setCollections(Array.isArray(data) ? data : (data.collections || []));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        slug: initialData.slug || '',
        shortDescription: initialData.shortDescription || '',
        description: initialData.description || '',
        collection_id: initialData.collection_id || (initialData.collection ? initialData.collection.id : ''),
        category: initialData.category || '',
        price: initialData.price ? String(initialData.price) : ''
      });
      setImages(parseImages(initialData));
      setSelectedColors(parseColors(initialData));
      setSelectedFabricAppearances(parseFabricAppearances(initialData));
      setImagesChanged(false);
    } else {
      reset({
        name: '',
        slug: '',
        shortDescription: '',
        description: '',
        collection_id: '',
        category: '',
        price: ''
      });
      setImages([]);
      setSelectedColors([]);
      setSelectedFabricAppearances([]);
      setImagesChanged(false);
    }
  }, [initialData, reset]);

  const nameValue = watch('name');

  // Auto-generate slug from name if creating
  useEffect(() => {
    if (!initialData && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug);
    }
  }, [nameValue, initialData, setValue]);

  const handleFormSubmit = (data) => {
    const payload = { ...data, colors: selectedColors, fabricAppearances: selectedFabricAppearances };
    
    if (!initialData || imagesChanged) {
      payload.images = images;
    }
    
    onSubmit(payload);
  };

  const toggleColor = (color) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter(c => c !== color));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    setImagesChanged(true);
  };

  return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-10">
      {/* Imagens */}
      <div className="space-y-4">
        <h4 className="text-2xl font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-3">
          Galeria de Imagens (Cores da Camisa)
        </h4>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Adicione as imagens das cores disponíveis para esta estampa. A primeira imagem principal será exibida na vitrine.
        </p>
        <UploadArea images={images} onChange={handleImagesChange} />
      </div>

      {/* Cores */}
      <div className="space-y-4">
        <h4 className="text-2xl font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-3">
          Cores Disponíveis
        </h4>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Selecione as cores em que esta estampa está disponível.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {COLORS_LIST.map(color => (
            <label key={color} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              <input
                type="checkbox"
                checked={selectedColors.includes(color)}
                onChange={() => toggleColor(color)}
                className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-white">{color}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Aparência da Malha */}
      <div className="space-y-4">
        <h4 className="text-2xl font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-3">
          Aparência da Malha
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Liso', 'Estonado'].map(appearance => (
            <label key={appearance} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              <input
                type="checkbox"
                checked={selectedFabricAppearances.includes(appearance)}
                onChange={() => {
                  if (selectedFabricAppearances.includes(appearance)) {
                    setSelectedFabricAppearances(selectedFabricAppearances.filter(a => a !== appearance));
                  } else {
                    setSelectedFabricAppearances([...selectedFabricAppearances, appearance]);
                  }
                }}
                className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-white">{appearance}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Informações Básicas */}
        <div className="space-y-6 md:col-span-2">
          <h4 className="text-2xl font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-3">
            Informações Básicas
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Nome da Estampa *</label>
              <input
                {...register('name', { required: 'Nome é obrigatório' })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
                placeholder="Ex: Zé Pilintra"
              />
              {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">URL do Produto *</label>
              <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden focus-within:border-[var(--color-primary)] transition-all duration-300 h-12">
                <span className="text-[var(--color-text-muted)] pl-5 pr-1 text-sm select-none">/produto/</span>
                <input
                  {...register('slug', { required: 'URL do produto é obrigatória' })}
                  className="w-full bg-transparent text-white focus:outline-none h-full pr-5 text-sm"
                  placeholder="nome-do-produto"
                />
              </div>
              {errors.slug && <span className="text-red-500 text-xs mt-1 block">{errors.slug.message}</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Descrição Curta</label>
            <input
              {...register('shortDescription')}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              placeholder="Breve resumo da estampa..."
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Descrição Completa</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 resize-none"
              placeholder="Detalhes completos..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Coleção (Opcional)</label>
              <select
                {...register('collection_id')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              >
                <option value="">Nenhuma coleção</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Categoria *</label>
              <select
                {...register('category', { required: 'Categoria é obrigatória' })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              >
                <option value="">Selecione uma categoria...</option>
                <option value="Camisetas">Camisetas</option>
                <option value="Camisas">Camisas</option>
                <option value="Casacos">Casacos</option>
                <option value="Bermudas">Bermudas</option>
                <option value="Canecas">Canecas</option>
                <option value="Instrumentos">Instrumentos</option>
                <option value="Sublimação">Sublimação</option>
                <option value="Acessórios">Acessórios</option>
                <option value="Produtos Digitais">Produtos Digitais</option>
              </select>
              {errors.category && <span className="text-red-500 text-xs mt-1 block">{errors.category.message}</span>}
            </div>
          </div>
        </div>

        {/* Preços */}
        <div className="space-y-6">
          <h4 className="text-2xl font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-3">
            Preços
          </h4>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Preço de Venda (R$) *</label>
              <input
                type="number"
                step="0.01"
                {...register('price', { required: 'Preço é obrigatório' })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 font-heading text-xl"
                placeholder="99.90"
              />
              {errors.price && <span className="text-red-500 text-xs mt-1 block">{errors.price.message}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-[var(--color-border)] flex justify-end gap-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          )}
          {initialData ? 'Atualizar Produto' : 'Cadastrar Produto'}
        </button>
      </div>
    </form>
  );
}

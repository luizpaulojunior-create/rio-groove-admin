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
      price: '',
      meta_title: '',
      meta_description: '',
      seo_keywords: '',
      og_image: ''
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
    let colors = [];
    if (data && data.colors) {
      if (typeof data.colors === 'string') {
        try {
          const parsed = JSON.parse(data.colors);
          colors = Array.isArray(parsed) ? parsed : [];
        } catch {}
      } else {
        colors = Array.isArray(data.colors) ? [...data.colors] : [];
      }
    }
    
    // Migração automática de offWhite
    if (data) {
      const rawFabrics = data.fabric_appearances || data.fabricAppearances;
      let fabrics = [];
      if (rawFabrics) {
        if (typeof rawFabrics === 'string') {
          try {
            const parsed = JSON.parse(rawFabrics);
            fabrics = Array.isArray(parsed) ? parsed : [];
          } catch {}
        } else {
          fabrics = Array.isArray(rawFabrics) ? rawFabrics : [];
        }
        
        if (fabrics.includes('offWhite') || fabrics.includes('Off White')) {
          if (!colors.includes('Off White') && !colors.includes('offWhite')) {
            colors.push('Off White');
          }
        }
      }
    }
    
    // Normalizar offWhite na lista de cores
    return colors.map(c => c === 'offWhite' ? 'Off White' : c);
  };

  const parseFabricAppearances = (data) => {
    const raw = data?.fabric_appearances || data?.fabricAppearances;
    let fabrics = [];
    if (!raw) return [];
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        fabrics = Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    } else {
      fabrics = Array.isArray(raw) ? raw : [];
    }
    
    // Remover offWhite completamente da aparência
    return fabrics.filter(f => f !== 'offWhite' && f !== 'Off White');
  };

  const [images, setImages] = useState(() => parseImages(initialData));
  const [imagesChanged, setImagesChanged] = useState(false);
  const [collections, setCollections] = useState([]);
  
  const COLORS_LIST = [
    'Preto', 'Branco', 'Off White', 'Bege', 'Vermelho', 'Azul', 'Verde',
    'Amarelo', 'Cinza', 'Rosa', 'Roxo'
  ];
  const [selectedColors, setSelectedColors] = useState(() => parseColors(initialData));
  const [selectedFabricAppearances, setSelectedFabricAppearances] = useState(() => parseFabricAppearances(initialData));
  const [variants, setVariants] = useState(() => initialData?.product_variants || initialData?.variants || []);

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
        price: initialData.price ? String(initialData.price) : '',
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || '',
        seo_keywords: initialData.seo_keywords || '',
        og_image: initialData.og_image || ''
      });
      setImages(parseImages(initialData));
      setSelectedColors(parseColors(initialData));
      setSelectedFabricAppearances(parseFabricAppearances(initialData));
      setVariants(initialData.product_variants || initialData.variants || []);
      setImagesChanged(false);
    } else {
      reset({
        name: '',
        slug: '',
        shortDescription: '',
        description: '',
        collection_id: '',
        category: '',
        price: '',
        meta_title: '',
        meta_description: '',
        seo_keywords: '',
        og_image: ''
      });
      setImages([]);
      setSelectedColors([]);
      setSelectedFabricAppearances([]);
      setVariants([]);
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
    const payload = { 
      ...data, 
      colors: selectedColors, 
      fabricAppearances: selectedFabricAppearances,
      variants: JSON.stringify(variants)
    };
    
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
          {['liso', 'estonado'].map(appearance => (
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
              <span className="text-sm text-white capitalize">{appearance}</span>
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

      {/* Variantes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <h4 className="text-2xl font-heading tracking-wide text-white">
            Variações (SKUs)
          </h4>
          <button
            type="button"
            onClick={() => setVariants([...variants, { id: Date.now().toString(), color: '', size: 'M', sku: '', stock: 0, price_override: '' }])}
            className="btn-secondary text-sm py-1 px-3"
          >
            + Adicionar Variação
          </button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Gerencie o estoque e SKUs por tamanho e cor. O estoque total será a soma das variações.
        </p>

        {variants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                  <th className="pb-2 font-medium">Cor</th>
                  <th className="pb-2 font-medium">Tamanho</th>
                  <th className="pb-2 font-medium">SKU *</th>
                  <th className="pb-2 font-medium">Estoque</th>
                  <th className="pb-2 font-medium">Preço (Opcional)</th>
                  <th className="pb-2 font-medium">Imagem (URL)</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {variants.map((v, index) => (
                  <tr key={v.id || index}>
                    <td className="py-3 pr-2 min-w-[120px]">
                      <select 
                        value={v.color} 
                        onChange={(e) => {
                          const newV = [...variants];
                          newV[index].color = e.target.value;
                          setVariants(newV);
                        }}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                      >
                        <option value="">Selecione...</option>
                        {selectedColors.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-2 min-w-[100px]">
                      <select 
                        value={v.size} 
                        onChange={(e) => {
                          const newV = [...variants];
                          newV[index].size = e.target.value;
                          setVariants(newV);
                        }}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                      >
                        {['PP', 'P', 'M', 'G', 'GG', 'XG'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-2 min-w-[150px]">
                      <input 
                        required
                        value={v.sku}
                        onChange={(e) => {
                          const newV = [...variants];
                          newV[index].sku = e.target.value;
                          setVariants(newV);
                        }}
                        placeholder="Ex: CAM-PRT-M"
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </td>
                    <td className="py-3 pr-2 min-w-[100px]">
                      <input 
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => {
                          const newV = [...variants];
                          newV[index].stock = parseInt(e.target.value) || 0;
                          setVariants(newV);
                        }}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </td>
                    <td className="py-3 pr-2 min-w-[120px]">
                      <input 
                        type="number"
                        step="0.01"
                        value={v.price_override || ''}
                        onChange={(e) => {
                          const newV = [...variants];
                          newV[index].price_override = e.target.value ? parseFloat(e.target.value) : null;
                          setVariants(newV);
                        }}
                        placeholder="Sobrescrever"
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </td>
                    <td className="py-3 pr-2 min-w-[150px]">
                      <input 
                        type="text"
                        value={v.image || ''}
                        onChange={(e) => {
                          const newV = [...variants];
                          newV[index].image = e.target.value;
                          setVariants(newV);
                        }}
                        placeholder="URL da imagem (opcional)"
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        type="button"
                        onClick={() => {
                          const newV = variants.filter((_, i) => i !== index);
                          setVariants(newV);
                        }}
                        className="text-red-500 hover:text-red-400 p-2"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 text-center text-[var(--color-text-muted)]">
            Nenhuma variação cadastrada. Clique no botão acima para adicionar.
          </div>
        )}
      </div>

      {/* SEO & Compartilhamento */}
      <div className="space-y-6 md:col-span-2">
        <h4 className="text-2xl font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-3">
          SEO & Compartilhamento
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0D0D0D] p-6 rounded-2xl border border-white/5">
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Meta Title</label>
            <input
              {...register('meta_title')}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              placeholder="Título para buscadores (opcional)"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Meta Description</label>
            <textarea
              {...register('meta_description')}
              rows={3}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 resize-none"
              placeholder="Descrição para buscadores..."
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Palavras-chave (Keywords)</label>
            <input
              {...register('seo_keywords')}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              placeholder="camisa, rock, vintage..."
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">OG Image (URL)</label>
            <input
              {...register('og_image')}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              placeholder="URL da imagem para redes sociais..."
            />
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

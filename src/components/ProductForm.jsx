import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import UploadArea from './UploadArea';

export default function ProductForm({ initialData, onSubmit, onCancel, isLoading }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: initialData || {
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      collection: '',
      category: '',
      tags: '',
      price: '',
      promotionalPrice: '',
      costPrice: '',
      metaTitle: '',
      metaDescription: '',
      keywords: ''
    }
  });

  const [images, setImages] = useState(initialData?.images || []);

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
    onSubmit({ ...data, images });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Imagens */}
      <div className="space-y-4">
        <h4 className="text-lg font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-2">
          Galeria de Imagens (Cores da Camisa)
        </h4>
        <p className="text-sm text-[var(--color-text-muted)]">
          Adicione as imagens das cores disponíveis para esta estampa. A primeira imagem principal será exibida na vitrine.
        </p>
        <UploadArea images={images} onChange={setImages} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <div className="space-y-4 md:col-span-2">
          <h4 className="text-lg font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-2">
            Informações Básicas
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Nome da Estampa *</label>
              <input
                {...register('name', { required: 'Nome é obrigatório' })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Ex: Zé Pilintra"
              />
              {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Slug (URL) *</label>
              <input
                {...register('slug', { required: 'Slug é obrigatório' })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="ex-ze-pilintra"
              />
              {errors.slug && <span className="text-red-500 text-xs mt-1">{errors.slug.message}</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Descrição Curta</label>
            <input
              {...register('shortDescription')}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="Breve resumo da estampa..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Descrição Completa</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
              placeholder="Detalhes completos..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Coleção</label>
              <input
                {...register('collection')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Ex: Verão 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Categoria</label>
              <input
                {...register('category')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Ex: Camisetas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Tags (separadas por vírgula)</label>
              <input
                {...register('tags')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="umbanda, orixa, exu"
              />
            </div>
          </div>
        </div>

        {/* Preços */}
        <div className="space-y-4">
          <h4 className="text-lg font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-2">
            Preços
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Preço de Venda (R$) *</label>
              <input
                type="number"
                step="0.01"
                {...register('price', { required: 'Preço é obrigatório' })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="99.90"
              />
              {errors.price && <span className="text-red-500 text-xs mt-1">{errors.price.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Preço Promocional (R$)</label>
              <input
                type="number"
                step="0.01"
                {...register('promotionalPrice')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="79.90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                {...register('costPrice')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="35.00"
              />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="space-y-4">
          <h4 className="text-lg font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-2">
            SEO
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Meta Title</label>
              <input
                {...register('metaTitle')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Título para buscadores..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Meta Description</label>
              <textarea
                {...register('metaDescription')}
                rows={2}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                placeholder="Descrição para buscadores..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Keywords</label>
              <input
                {...register('keywords')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="palavra1, palavra2..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--color-border)] flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl font-medium text-white bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors glow-red disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {initialData ? 'Atualizar Produto' : 'Cadastrar Produto'}
        </button>
      </div>
    </form>
  );
}

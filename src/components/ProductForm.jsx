import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import UploadArea from './UploadArea';
import { collectionsService } from '../services/collections';

export default function ProductForm({ initialData, onSubmit, onCancel, isLoading }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: initialData || {
      name: '',
      slug: '',
      description: '',
      collection_id: '',
      category: '',
      price: ''
    }
  });

  const [images, setImages] = useState(initialData?.images || []);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    collectionsService.getCollections().then(data => {
      setCollections(Array.isArray(data) ? data : (data.collections || []));
    }).catch(console.error);
  }, []);

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
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-10">
      {/* Imagens */}
      <div className="space-y-4">
        <h4 className="text-2xl font-heading tracking-wide text-white border-b border-[var(--color-border)] pb-3">
          Galeria de Imagens (Cores da Camisa)
        </h4>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Adicione as imagens das cores disponíveis para esta estampa. A primeira imagem principal será exibida na vitrine.
        </p>
        <UploadArea images={images} onChange={setImages} />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Tags (separadas por vírgula)</label>
              <input
                {...register('tags')}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
                placeholder="umbanda, orixa, exu"
              />
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

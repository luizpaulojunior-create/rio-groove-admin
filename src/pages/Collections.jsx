import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { collectionsService } from '../services/collections';
import { toast } from 'react-toastify';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingCollection, setEditingCollection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await collectionsService.getCollections();
      setCollections(data);
    } catch (error) {
      console.error('Erro ao buscar coleções:', error);
      toast.error('Erro ao carregar coleções.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
    };

    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Salvando coleção...');
      if (editingCollection) {
        await collectionsService.updateCollection(editingCollection.id, data);
      } else {
        await collectionsService.createCollection(data);
      }
      toast.update(loadingToast, { render: 'Coleção salva com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
      setIsModalOpen(false);
      fetchCollections();
    } catch (error) {
      console.error('Erro ao salvar coleção:', error);
      toast.dismiss();
      toast.error('Erro ao salvar coleção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Nome', accessor: 'name', render: (row) => <span className="font-medium text-white">{row.name}</span> },
    { header: 'Slug', accessor: 'slug' },
    { header: 'Produtos', accessor: 'productsCount', render: (row) => row.productsCount || 0 },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${row.status === 'Ativa' || row.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
          {row.status === 'active' ? 'Ativa' : row.status || 'Inativa'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-heading text-4xl">Coleções</h1>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={collections}
          onEdit={handleEdit}
          onAdd={handleAdd}
          addButtonText="Nova Coleção"
          searchPlaceholder="Buscar coleções..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingCollection ? "Editar Coleção" : "Nova Coleção"}
        maxWidth="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Nome da Coleção</label>
            <input name="name" defaultValue={editingCollection?.name} required className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Slug</label>
            <input name="slug" defaultValue={editingCollection?.slug} required className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Descrição</label>
            <textarea name="description" defaultValue={editingCollection?.description} rows={3} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none" />
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-white bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors glow-red font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Coleção'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

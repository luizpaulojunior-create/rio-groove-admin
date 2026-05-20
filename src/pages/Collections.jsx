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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-heading text-4xl">Coleções</h1>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
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
        <form className="space-y-6" onSubmit={handleSave}>
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Nome da Coleção</label>
            <input name="name" defaultValue={editingCollection?.name} required className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Slug</label>
            <input name="slug" defaultValue={editingCollection?.slug} required className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Descrição</label>
            <textarea name="description" defaultValue={editingCollection?.description} rows={4} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 resize-none" />
          </div>
          
          <div className="pt-6 flex justify-end gap-3 border-t border-[var(--color-border)] mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Coleção'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

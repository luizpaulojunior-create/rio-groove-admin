import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import { productsService } from '../services/products';
import { storageService } from '../services/storage';
import { toast } from 'react-toastify';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (isSubmitting) return;
    if (window.confirm(`Tem certeza que deseja excluir a estampa "${product.name}"?`)) {
      try {
        setIsSubmitting(true);
        const loadingToast = toast.loading('Excluindo estampa...');
        await productsService.deleteProduct(product.id);
        setProducts(products.filter(p => p.id !== product.id));
        toast.update(loadingToast, { render: 'Estampa excluída com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        toast.dismiss();
        toast.error("Erro ao excluir produto.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (formData) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading(editingProduct ? 'Atualizando estampa...' : 'Criando estampa...');
      
      let processedImages = [];
      if (formData.images && formData.images.length > 0) {
        for (let img of formData.images) {
          if (img.file) {
            const uploaded = await storageService.uploadProductImage(img.file);
            processedImages.push({
              url: uploaded.url,
              path: uploaded.path,
              isMain: img.isMain
            });
          } else {
            processedImages.push({
              url: img.url,
              path: img.path,
              isMain: img.isMain
            });
          }
        }
      }

      const dataToSave = { ...formData, images: processedImages };

      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, dataToSave);
      } else {
        await productsService.createProduct(dataToSave);
      }
      
      toast.update(loadingToast, { render: editingProduct ? 'Estampa atualizada!' : 'Estampa criada!', type: 'success', isLoading: false, autoClose: 3000 });
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.dismiss();
      toast.error("Erro ao salvar produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Estampa',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shrink-0">
            {row.images && row.images.length > 0 ? (
              <img src={row.images.find(i => i.isMain)?.preview || row.images.find(i => i.isMain)?.url || row.images[0].url} alt={row.name} className="w-full h-full object-cover" loading="lazy" width="40" height="40" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-xs">Sem img</div>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Slug: {row.slug}</p>
          </div>
        </div>
      )
    },
    { header: 'Coleção', accessor: 'collection', render: (row) => row.collection || '-' },
    { header: 'Categoria', accessor: 'category', render: (row) => row.category || '-' },
    {
      header: 'Preço',
      accessor: 'price',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">R$ {Number(row.price).toFixed(2)}</span>
          {row.promotionalPrice && (
            <span className="text-xs text-[var(--color-primary)] line-through">R$ {Number(row.promotionalPrice).toFixed(2)}</span>
          )}
        </div>
      )
    },
    {
      header: 'Cores Disponíveis',
      accessor: 'images',
      render: (row) => (
        <div className="flex -space-x-2">
          {(row.images || []).slice(0, 3).map((img, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] overflow-hidden bg-white">
              <img src={img.preview || img.url} alt="" className="w-full h-full object-cover" loading="lazy" width="32" height="32" />
            </div>
          ))}
          {(row.images?.length || 0) > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-border)] flex items-center justify-center text-xs text-white">
              +{(row.images.length - 3)}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-heading text-4xl">Produtos (Estampas)</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin glow-red"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          addButtonText="Nova Estampa"
          searchPlaceholder="Buscar estampas..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingProduct ? 'Editar Estampa' : 'Nova Estampa'}
        maxWidth="max-w-4xl"
      >
        <ProductForm
          initialData={editingProduct}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}

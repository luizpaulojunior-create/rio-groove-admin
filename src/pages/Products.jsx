import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import { productsService } from '../services/products';
import { toast } from 'react-toastify';
import { normalizeImageUrl } from '../utils/imageUtils';

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
      
      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, formData);
      } else {
        await productsService.createProduct(formData);
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
      render: (row) => {
        let parsedImages = row.images;
        if (typeof parsedImages === 'string') {
          try { parsedImages = JSON.parse(parsedImages); } catch { parsedImages = []; }
        }
        if (!Array.isArray(parsedImages)) parsedImages = [];

        const imageUrl = row.image_url || 
          (row.product_images && row.product_images.length > 0 ? row.product_images[0].image_url : null) || 
          (parsedImages.length > 0 ? (
            typeof parsedImages[0] === 'string' ? parsedImages[0] : (parsedImages.find(i => i.isMain)?.preview || parsedImages.find(i => i.isMain)?.url || parsedImages[0].url || parsedImages[0].image_url)
          ) : null);
        
        return (
        <div className="flex items-center gap-3">
          <div className="w-[72px] h-[72px] rounded-2xl bg-[#0D0D0D] border border-[var(--color-border)] overflow-hidden shrink-0 transition-all hover:shadow-[0_0_15px_rgba(255,43,6,0.3)] hover:border-[var(--color-primary)]">
            {imageUrl ? (
              <img src={normalizeImageUrl(imageUrl)} alt={row.name} className="w-full h-full object-cover transition-transform hover:scale-105" loading="lazy" width="72" height="72" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                <svg className="w-6 h-6 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Slug: {row.slug}</p>
          </div>
        </div>
      )}
    },
    { header: 'Coleção', accessor: 'collection', render: (row) => row.collections?.name || row.collection || '-' },
    { header: 'Categoria', accessor: 'category', render: (row) => row.category || '-' },
    {
      header: 'Cores',
      accessor: 'colors',
      render: (row) => {
        let colors = row.colors || [];
        if (typeof colors === 'string') {
          try { colors = JSON.parse(colors); } catch { colors = []; }
        }
        if (!Array.isArray(colors)) colors = [];

        return (
          <div className="flex gap-1 flex-wrap max-w-[120px]">
            {colors.length > 0 ? colors.map(color => (
              <span key={color} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-white whitespace-nowrap">
                {color}
              </span>
            )) : <span className="text-[10px] text-[var(--color-text-muted)]">-</span>}
          </div>
        );
      }
    },
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
      render: (row) => {
        let images = row.product_images || row.images || [];
        if (typeof images === 'string') {
          try { images = JSON.parse(images); } catch { images = []; }
        }
        if (!Array.isArray(images)) images = [];

        return (
        <div className="flex -space-x-2">
          {images.slice(0, 3).map((img, i) => {
            const imgUrl = typeof img === 'string' ? img : (img.image_url || img.preview || img.url);
            return (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] overflow-hidden bg-white">
                <img src={normalizeImageUrl(imgUrl)} alt="" className="w-full h-full object-cover" loading="lazy" width="32" height="32" />
              </div>
            );
          })}
          {images.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-surface)] bg-[#0D0D0D] flex items-center justify-center text-xs text-white">
              +{images.length - 3}
            </div>
          )}
        </div>
      )}
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

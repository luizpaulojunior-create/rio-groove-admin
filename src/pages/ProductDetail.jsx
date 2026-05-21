import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Tag, Package, LayoutGrid, CheckCircle } from 'lucide-react';
import { productsService } from '../services/products';
import { toast } from 'react-toastify';
import { normalizeImageUrl } from '../utils/imageUtils';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productsService.getProduct(id);
      setProduct(data);
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      toast.error("Erro ao carregar produto.");
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Atualizando estampa...');
      await productsService.updateProduct(id, formData);
      toast.update(loadingToast, { render: 'Estampa atualizada!', type: 'success', isLoading: false, autoClose: 3000 });
      setIsEditModalOpen(false);
      fetchProduct(); // Refetch
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.dismiss();
      toast.error("Erro ao salvar produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin glow-red"></div>
      </div>
    );
  }

  if (!product) return null;

  // Process Images
  let images = product.product_images || product.images || [];
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = []; }
  }
  if (!Array.isArray(images)) images = [];

  const mainImage = product.image_url || 
    (product.product_images && product.product_images.length > 0 ? product.product_images[0].image_url : null) || 
    (images.length > 0 ? (typeof images[0] === 'string' ? images[0] : (images.find(i => i.isMain)?.url || images[0].url || images[0].image_url)) : null);

  // Process Fabric Appearances
  let fabrics = product.fabric_appearances || product.fabricAppearances || [];
  if (typeof fabrics === 'string') {
    try { fabrics = JSON.parse(fabrics); } catch { fabrics = []; }
  }
  if (!Array.isArray(fabrics)) fabrics = [];

  // Process Colors
  let colors = product.colors || [];
  if (typeof colors === 'string') {
    try { colors = JSON.parse(colors); } catch { colors = []; }
  }
  if (!Array.isArray(colors)) colors = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/products')}
            className="w-10 h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-primary)] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading text-3xl">{product.name}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${product.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
            {product.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="btn-primary"
        >
          <Edit size={18} className="mr-2" />
          Editar produto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Images */}
        {(mainImage || images.length > 0) && (
          <div className="space-y-6">
            <div className="card-premium">
              <h3 className="text-lg font-heading mb-4 text-white">Mídia</h3>
              {mainImage && (
                <div className="w-full aspect-square rounded-xl bg-[#0D0D0D] border border-[var(--color-border)] overflow-hidden mb-4 relative group">
                  <img src={normalizeImageUrl(mainImage)} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              )}
              
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, i) => {
                    const imgUrl = typeof img === 'string' ? img : (img.image_url || img.preview || img.url);
                    return (
                      <div key={i} className="aspect-square rounded-lg border border-[var(--color-border)] overflow-hidden bg-[#0D0D0D]">
                        <img src={normalizeImageUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Middle Column: Details */}
        <div className={`space-y-6 ${(mainImage || images.length > 0) ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* General Info */}
          <div className="card-premium">
            <h3 className="text-lg font-heading mb-6 text-white border-b border-[var(--color-border)] pb-3">Detalhes Gerais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {product.name && (
                <div>
                  <label className="text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] block mb-1">Nome da Estampa</label>
                  <p className="text-white font-medium">{product.name}</p>
                </div>
              )}
              
              {product.slug && (
                <div>
                  <label className="text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] block mb-1">Slug</label>
                  <p className="text-white text-sm bg-[var(--color-surface)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] inline-block">/{product.slug}</p>
                </div>
              )}
              
              {product.shortDescription && (
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] block mb-1">Descrição Curta</label>
                  <p className="text-white">{product.shortDescription}</p>
                </div>
              )}
              
              {product.description && (
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] block mb-1">Descrição Completa</label>
                  <p className="text-[var(--color-text-muted)] whitespace-pre-wrap text-sm leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classification */}
            {(product.category || product.collections?.name || product.collection) && (
              <div className="card-premium">
                <h3 className="text-lg font-heading mb-6 text-white border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                  <Tag size={18} className="text-[var(--color-primary)]" />
                  Classificação
                </h3>
                
                <div className="space-y-4">
                  {product.category && (
                    <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                      <span className="text-[var(--color-text-muted)] text-sm">Categoria</span>
                      <span className="text-white font-medium">{product.category}</span>
                    </div>
                  )}
                  
                  {(product.collections?.name || product.collection) && (
                    <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                      <span className="text-[var(--color-text-muted)] text-sm">Coleção</span>
                      <span className="text-white font-medium">{product.collections?.name || product.collection}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attributes */}
            {(fabrics.length > 0 || colors.length > 0) && (
              <div className="card-premium">
                <h3 className="text-lg font-heading mb-6 text-white border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-[var(--color-primary)]" />
                  Atributos
                </h3>
                
                <div className="space-y-4">
                  {fabrics.length > 0 && (
                    <div>
                      <span className="text-[var(--color-text-muted)] text-sm block mb-2">Aparência da Malha (Checks)</span>
                      <div className="flex gap-2 flex-wrap">
                        {fabrics.map(fabric => (
                          <span key={fabric} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-white whitespace-nowrap capitalize">
                            {fabric === 'offWhite' ? 'Off White' : fabric}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {colors.length > 0 && (
                    <div>
                      <span className="text-[var(--color-text-muted)] text-sm block mb-2 mt-4">Cores Disponíveis</span>
                      <div className="flex gap-2 flex-wrap">
                        {colors.map(color => (
                          <span key={color} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-white whitespace-nowrap">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing */}
            {(product.price || product.promotionalPrice) && (
              <div className="card-premium">
                <h3 className="text-lg font-heading mb-6 text-white border-b border-[var(--color-border)] pb-3">
                  Preços
                </h3>
                
                <div className="space-y-4">
                  {product.price && (
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--color-text-muted)] text-sm">Preço de Venda</span>
                      <span className="text-2xl font-heading text-white">R$ {Number(product.price).toFixed(2)}</span>
                    </div>
                  )}
                  {product.promotionalPrice && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[var(--color-text-muted)] text-sm">Preço Promocional</span>
                      <span className="text-xl font-heading text-[var(--color-primary)]">R$ {Number(product.promotionalPrice).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Stock */}
            {(product.stock !== undefined && product.stock !== null && product.stock !== '') && (
              <div className="card-premium">
                <h3 className="text-lg font-heading mb-6 text-white border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                  <Package size={18} className="text-[var(--color-primary)]" />
                  Estoque Base
                </h3>
                
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-muted)] text-sm">Quantidade Total</span>
                  <span className="text-xl font-medium text-white">{product.stock}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Editar Estampa"
        maxWidth="max-w-4xl"
      >
        <ProductForm
          initialData={product}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}

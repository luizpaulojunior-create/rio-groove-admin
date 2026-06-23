import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon, Copy } from 'lucide-react';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import { productsService } from '../services/products';
import { buildDuplicateProductDraft } from '../utils/productDuplicate';
import { toast } from 'react-toastify';
import { normalizeImageUrl } from '../utils/imageUtils';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [duplicateDraft, setDuplicateDraft] = useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchProducts = async (showLoading = true) => {
    try {
      const data = await productsService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(false);
  }, []);

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (product) => {
    try {
      const full = await productsService.getProduct(product.id);
      setDuplicateDraft(buildDuplicateProductDraft(full));
      setIsDuplicateModalOpen(true);
    } catch (error) {
      console.error('Erro ao preparar duplicação:', error);
      toast.error('Erro ao carregar produto para duplicar.');
    }
  };

  const handleDuplicateSubmit = async (formData) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Criando cópia da estampa...');
      await productsService.createProduct({
        ...formData,
        active: 'false',
        variants: JSON.stringify([]),
      });
      toast.update(loadingToast, {
        render: 'Cópia criada com sucesso!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      setIsDuplicateModalOpen(false);
      setDuplicateDraft(null);
      fetchProducts(false);
    } catch (error) {
      console.error('Erro ao duplicar produto:', error);
      toast.dismiss();
      toast.error(error.message || 'Erro ao duplicar produto.');
    } finally {
      setIsSubmitting(false);
    }
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
      fetchProducts(false);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.dismiss();
      toast.error(error.message || "Erro ao salvar produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Paginate
  const filteredProducts = products.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.slug?.toLowerCase().includes(term) ||
      p.collection?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getProductImage = (row) => {
    let parsedImages = row.images;
    if (typeof parsedImages === 'string') {
      try { parsedImages = JSON.parse(parsedImages); } catch { parsedImages = []; }
    }
    if (!Array.isArray(parsedImages)) parsedImages = [];

    return row.image_url || 
      (row.product_images && row.product_images.length > 0 ? row.product_images[0].image_url : null) || 
      (parsedImages.length > 0 ? (
        typeof parsedImages[0] === 'string' ? parsedImages[0] : (parsedImages.find(i => i.isMain)?.preview || parsedImages.find(i => i.isMain)?.url || parsedImages[0].url || parsedImages[0].image_url)
      ) : null);
  };

  const parseJsonArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-5xl tracking-wide uppercase text-white mb-1">PRODUTOS (ESTAMPAS).</h1>
          <p className="text-[#A3A3A3] font-sans">Gerencie todas as estampas dos seus produtos.</p>
        </div>
        <button
          onClick={handleAdd}
          className="h-[48px] px-6 bg-[#FF4D00] hover:bg-[#FF5E1F] text-white rounded-[16px] font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={20} />
          NOVA ESTAMPA
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md mb-6">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]"
          size={20}
        />
        <input
          type="text"
          placeholder="Buscar estampas..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-[16px] pl-12 pr-4 h-[52px] text-white focus:outline-none focus:border-[#FF4D00] transition-all duration-300 placeholder-[#A3A3A3]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] overflow-hidden">
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="py-4 px-6 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider w-[32%]">Estampa</th>
                  <th className="py-4 px-6 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider w-[14%]">Coleção</th>
                  <th className="py-4 px-6 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider w-[14%]">Categoria</th>
                  <th className="py-4 px-6 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider w-[10%]">Malha</th>
                  <th className="py-4 px-6 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider w-[12%]">Cores</th>
                  <th className="py-4 px-6 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider w-[10%]">Preço</th>
                  <th className="py-4 px-6 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider w-[6%] text-center">Cores Disp.</th>
                  <th className="py-4 px-6 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider w-[2%] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {paginatedProducts.length > 0 ? paginatedProducts.map((row) => {
                  const imageUrl = getProductImage(row);
                  
              let fabrics = parseJsonArray(row.fabric_appearances || row.fabricAppearances);
              fabrics = fabrics.filter(f => f !== 'offWhite' && f !== 'Off White');

              let colors = parseJsonArray(row.colors);
              let originalFabrics = parseJsonArray(row.fabric_appearances || row.fabricAppearances);
              if (originalFabrics.includes('offWhite') || originalFabrics.includes('Off White')) {
                if (!colors.includes('Off White') && !colors.includes('offWhite')) {
                  colors.push('Off White');
                }
              }
              colors = colors.map(c => c === 'offWhite' ? 'Off White' : c);

              let dispImages = parseJsonArray(row.product_images || row.images);

              return (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-6 px-6 align-middle">
                        <div className="flex items-center gap-4">
                          <Link to={`/admin/products/${row.id}`} className="w-[64px] h-[64px] rounded-[16px] bg-[#050505] border border-[rgba(255,255,255,0.06)] overflow-hidden shrink-0 transition-all hover:border-[#FF4D00] flex items-center justify-center group/img">
                            {imageUrl ? (
                              <img src={normalizeImageUrl(imageUrl)} alt={row.name} className="w-full h-full object-cover transition-transform group-hover/img:scale-105" loading="lazy" width="64" height="64" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-[#A3A3A3] opacity-40" />
                            )}
                          </Link>
                          <div className="flex flex-col justify-center">
                            <Link to={`/admin/products/${row.id}`} className="font-bold text-base text-white hover:text-[#FF4D00] transition-colors">{row.name}</Link>
                            <p className="text-sm text-white/60">/{row.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-6 align-middle">
                        <span className="text-white text-sm">{row.collections?.name || row.collection || '-'}</span>
                      </td>
                      <td className="py-6 px-6 align-middle">
                        <span className="text-white text-sm">{row.category || '-'}</span>
                      </td>
                      <td className="py-6 px-6 align-middle">
                        <div className="flex gap-2 flex-wrap">
                          {fabrics.length > 0 ? fabrics.map(fabric => (
                            <span key={fabric} className="text-xs px-3 py-1 rounded-full bg-[rgba(255,255,255,0.04)] text-white whitespace-nowrap capitalize">
                              {fabric}
                            </span>
                          )) : <span className="text-sm text-[#A3A3A3]">-</span>}
                        </div>
                      </td>
                      <td className="py-6 px-6 align-middle">
                        <div className="flex gap-2 flex-wrap">
                          {colors.length > 0 ? colors.map(color => (
                            <span key={color} className="text-xs px-3 py-1 rounded-full bg-[rgba(255,255,255,0.04)] text-white whitespace-nowrap">
                              {color}
                            </span>
                          )) : <span className="text-sm text-[#A3A3A3]">-</span>}
                        </div>
                      </td>
                      <td className="py-6 px-6 align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium text-white text-sm">R$ {Number(row.price).toFixed(2)}</span>
                          {row.promotionalPrice && (
                            <span className="text-xs text-[#FF4D00] line-through">R$ {Number(row.promotionalPrice).toFixed(2)}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-6 px-6 align-middle text-center">
                        <div className="flex -space-x-2 justify-center">
                          {dispImages.slice(0, 3).map((img, i) => {
                            const imgUrl = typeof img === 'string' ? img : (img.image_url || img.preview || img.url);
                            return (
                              <div key={i} className="w-[28px] h-[28px] rounded-full border-2 border-[#0D0D0D] overflow-hidden bg-white">
                                <img src={normalizeImageUrl(imgUrl)} alt="" className="w-full h-full object-cover" loading="lazy" width="28" height="28" />
                              </div>
                            );
                          })}
                          {dispImages.length > 3 && (
                            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#0D0D0D] bg-[#0A0A0A] flex items-center justify-center text-[10px] text-white">
                              +{dispImages.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-6 px-6 align-middle text-center">
                        <div className="flex items-center justify-center gap-2 mx-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(row)}
                            className="w-[40px] h-[40px] rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,77,0,0.12)] text-zinc-300 hover:text-white flex items-center justify-center transition-all"
                            title="Duplicar"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="w-[40px] h-[40px] rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,77,0,0.12)] text-[#FF4D4D] flex items-center justify-center transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#A3A3A3]">Nenhum produto encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden flex flex-col divide-y divide-[rgba(255,255,255,0.06)]">
            {paginatedProducts.length > 0 ? paginatedProducts.map((row) => {
              const imageUrl = getProductImage(row);
              
              let fabrics = parseJsonArray(row.fabric_appearances || row.fabricAppearances);
              fabrics = fabrics.filter(f => f !== 'offWhite' && f !== 'Off White');

              return (
                <div key={row.id} className="p-4 flex flex-col gap-4">
                  <div className="flex gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link to={`/admin/products/${row.id}`} className="w-[56px] h-[56px] rounded-[12px] bg-[#050505] border border-[rgba(255,255,255,0.06)] overflow-hidden shrink-0 flex items-center justify-center">
                        {imageUrl ? (
                          <img src={normalizeImageUrl(imageUrl)} alt={row.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#A3A3A3] opacity-40" />
                        )}
                      </Link>
                      <div>
                        <Link to={`/admin/products/${row.id}`} className="font-bold text-base text-white">{row.name}</Link>
                        <p className="text-xs text-white/60">/{row.slug}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(row)}
                      className="w-[36px] h-[36px] rounded-lg bg-[rgba(255,255,255,0.03)] text-[#FF4D4D] flex items-center justify-center shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div>
                      <span className="text-[#A3A3A3] block text-xs mb-1">Coleção</span>
                      <span className="text-white">{row.collections?.name || row.collection || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[#A3A3A3] block text-xs mb-1">Categoria</span>
                      <span className="text-white">{row.category || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[#A3A3A3] block text-xs mb-1">Malha</span>
                      <div className="flex gap-1 flex-wrap">
                        {fabrics.length > 0 ? fabrics.map(fabric => (
                          <span key={fabric} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.04)] text-white capitalize">
                            {fabric}
                          </span>
                        )) : <span className="text-[#A3A3A3]">-</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#A3A3A3] block text-xs mb-1">Preço</span>
                      <span className="font-medium text-white">R$ {Number(row.price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center text-[#A3A3A3]">Nenhum produto encontrado.</div>
            )}
          </div>

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[rgba(255,255,255,0.06)] gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF4D00]"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-[36px] h-[36px] rounded-lg border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.04] transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-[36px] h-[36px] rounded-lg text-sm flex items-center justify-center transition-colors ${
                            currentPage === page
                              ? 'bg-[rgba(255,255,255,0.08)] text-white font-medium'
                              : 'text-[#A3A3A3] hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="text-[#A3A3A3]">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-[36px] h-[36px] rounded-lg border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.04] transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => !isSubmitting && setIsDuplicateModalOpen(false)}
        title="Duplicar Estampa"
        maxWidth="max-w-4xl"
      >
        {duplicateDraft && (
          <ProductForm
            initialData={duplicateDraft}
            duplicateMode
            onSubmit={handleDuplicateSubmit}
            onCancel={() => setIsDuplicateModalOpen(false)}
            isLoading={isSubmitting}
          />
        )}
      </Modal>

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

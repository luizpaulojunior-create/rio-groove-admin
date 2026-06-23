import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Tag, Package, LayoutGrid, CheckCircle, 
  Plus, Minus, AlertTriangle, EyeOff, Copy, Clock, 
  Eye, Activity, TrendingUp, TrendingDown, RefreshCcw 
} from 'lucide-react';
import { productsService } from '../services/products';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { normalizeImageUrl } from '../utils/imageUtils';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import { buildDuplicateProductDraft } from '../utils/productDuplicate';

function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'agora';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `há ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  return date.toLocaleDateString('pt-BR');
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateDraft, setDuplicateDraft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    type: 'add',
    quantity: 1,
    reason: 'manual_adjustment',
    notes: ''
  });
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Timeline state
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const fetchMovements = useCallback(async (variantIds) => {
    try {
      setLoadingMovements(true);
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          product_variants (
            sku,
            color,
            size
          )
        `)
        .in('variant_id', variantIds)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!error && data) {
        setMovements(data);
      }
    } catch (error) {
      console.error("Erro ao carregar movimentos:", error);
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  const fetchProduct = useCallback(async (showLoading = true) => {
    try {
      const data = await productsService.getProduct(id);
      setProduct(data);
      
      if (data?.product_variants?.length > 0) {
        fetchMovements(data.product_variants.map(v => v.id));
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      toast.error("Erro ao carregar produto.");
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, fetchMovements]);

  useEffect(() => {
    fetchProduct(false);
  }, [fetchProduct]);

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    toast.info('Ajuste de estoque legado desativado. Use Estoque → Blanks no menu.');
    setAdjustModalOpen(false);
  };

  const handleEditSubmit = async (formData) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Atualizando produto...');
      await productsService.updateProduct(id, formData);
      toast.update(loadingToast, { render: 'Produto atualizado!', type: 'success', isLoading: false, autoClose: 3000 });
      setIsEditModalOpen(false);
      fetchProduct(false); 
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.dismiss();
      toast.error(error.message || "Erro ao salvar produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const newStatus = !product.active;
      await productsService.updateProduct(id, { active: newStatus });
      toast.success(`Produto ${newStatus ? 'ativado' : 'ocultado'} com sucesso!`);
      setProduct({ ...product, active: newStatus });
    } catch (error) {
      toast.error('Erro ao alterar status do produto.');
    }
  };

  const handleDuplicate = () => {
    setDuplicateDraft(buildDuplicateProductDraft(product));
    setIsDuplicateModalOpen(true);
  };

  const handleDuplicateSubmit = async (formData) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Criando cópia da estampa...');
      const created = await productsService.createProduct({
        ...formData,
        active: 'false',
        variants: JSON.stringify([]),
      });
      toast.update(loadingToast, {
        render: 'Cópia criada! Ajuste insumo/imagens e ative quando publicar.',
        type: 'success',
        isLoading: false,
        autoClose: 4000,
      });
      setIsDuplicateModalOpen(false);
      setDuplicateDraft(null);
      if (created?.id) {
        navigate(`/admin/products/${created.id}`);
      } else {
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Erro ao duplicar produto:', error);
      toast.dismiss();
      toast.error(error.message || 'Erro ao duplicar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin glow-red"></div>
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

  const currentDisplayImage = selectedImage || mainImage;

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

  // Migração automática de offWhite
  if (fabrics.includes('offWhite') || fabrics.includes('Off White')) {
    if (!colors.includes('Off White') && !colors.includes('offWhite')) {
      colors.push('Off White');
    }
  }
  colors = colors.map(c => c === 'offWhite' ? 'Off White' : c);
  fabrics = fabrics.filter(f => f !== 'offWhite' && f !== 'Off White');

  const totalStock = product.stock || 0;
  
  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* 1. HERO SECTION PREMIUM (Header + Quick Actions) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/admin/products')}
            className="w-12 h-12 rounded-full bg-[#0D0D0D] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#FF4D00] hover:bg-[#FF4D00]/10 transition-all shadow-lg"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading text-4xl tracking-wide text-white">{product.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${product.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                {product.active ? 'Ativo' : 'Oculto'}
              </span>
            </div>
            <p className="text-zinc-500 text-sm font-medium">/{product.slug}</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button 
            onClick={handleToggleActive}
            className="btn-secondary h-11 px-4 rounded-2xl text-sm flex items-center gap-2 border-white/10 bg-[#0D0D0D] hover:border-white/20 whitespace-nowrap text-zinc-300 hover:text-white"
          >
            {product.active ? <><EyeOff size={16} /> Ocultar</> : <><Eye size={16} /> Mostrar</>}
          </button>
          <button 
            onClick={handleDuplicate}
            className="btn-secondary h-11 px-4 rounded-2xl text-sm flex items-center gap-2 border-white/10 bg-[#0D0D0D] hover:border-white/20 whitespace-nowrap text-zinc-300 hover:text-white"
          >
            <Copy size={16} /> Duplicar
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="btn-primary h-11 px-6 rounded-2xl text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(255,77,0,0.2)] whitespace-nowrap bg-[#FF4D00] text-white hover:bg-[#FF4D00]/90 border-none"
          >
            <Edit size={16} className="mr-2" /> 
            EDITAR PRODUTO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: Mídia Cinematográfica */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0D0D0D] rounded-3xl p-5 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
            
            {/* Status Overlays */}
            {totalStock === 0 && (
              <div className="absolute top-8 right-8 z-10">
                <span className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  Esgotado
                </span>
              </div>
            )}
            
            {currentDisplayImage ? (
              <div className="w-full aspect-[4/5] rounded-2xl bg-[#050505] overflow-hidden relative shadow-inner">
                <img 
                  src={normalizeImageUrl(currentDisplayImage)} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                  loading="eager"
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/5] rounded-2xl bg-[#050505] flex items-center justify-center border border-dashed border-white/10">
                <span className="text-zinc-600 font-medium">Sem imagem</span>
              </div>
            )}
            
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto mt-5 pb-2 scrollbar-hide snap-x">
                {images.map((img, i) => {
                  const imgUrl = typeof img === 'string' ? img : (img.image_url || img.preview || img.url);
                  const isSelected = normalizeImageUrl(imgUrl) === normalizeImageUrl(currentDisplayImage);
                  return (
                    <button 
                      key={i} 
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`relative flex-none w-16 h-20 rounded-xl overflow-hidden bg-[#050505] transition-all duration-300 snap-center
                        ${isSelected ? 'ring-2 ring-[#FF4D00] ring-offset-2 ring-offset-[#0D0D0D] opacity-100' : 'border border-white/10 opacity-50 hover:opacity-100'}`}
                    >
                      <img src={normalizeImageUrl(imgUrl)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Timeline Operacional Resumida */}
          <div className="bg-[#0D0D0D] rounded-3xl p-6 border border-white/5 shadow-lg">
            <h3 className="text-lg font-heading text-white mb-6 flex items-center gap-2">
              <Activity size={18} className="text-[#FF4D00]" />
              Atividade Recente
            </h3>
            
            {loadingMovements ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-white/5 rounded w-3/4"></div>
                      <div className="h-2 bg-white/5 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : movements.length > 0 ? (
              <div className="space-y-5 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/10 before:to-transparent">
                {movements.map((mov, i) => {
                  const isPositive = mov.type === 'in' || mov.type === 'received' || mov.type === 'restock' || (mov.type === 'add');
                  const Icon = isPositive ? TrendingUp : TrendingDown;
                  const colorClass = isPositive ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20';
                  
                  // Translate reason
                  let reasonText = mov.reason;
                  if (mov.reason === 'manual_adjustment') reasonText = 'Ajuste manual';
                  if (mov.reason === 'sale' || mov.reason === 'order') reasonText = 'Venda';
                  if (mov.reason === 'received') reasonText = 'Recebimento';
                  if (mov.reason === 'returned') reasonText = 'Devolução';
                  if (mov.reason === 'loss') reasonText = 'Perda/Avaria';
                  
                  return (
                    <div key={mov.id || i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 ${colorClass}`}>
                        <Icon size={14} />
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] pl-3 md:pl-0 md:group-odd:pr-4 md:group-even:pl-4">
                        <div className="flex flex-col gap-1 bg-[#050505] p-3 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-white">{reasonText}</span>
                            <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : '-'}{mov.quantity}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center justify-between mt-1">
                            <span>{mov.product_variants?.sku || 'SKU'}</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(mov.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 text-sm">
                Nenhuma movimentação recente registrada.
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: Detalhes & Inventário */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Blocos Superiores: Preço, Categoria, Estoque Total */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0D0D0D] rounded-3xl p-6 border border-white/5 flex flex-col justify-center">
              <span className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-medium">Preço Atual</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-heading text-white">R$ {Number(product.promotionalPrice || product.price || 0).toFixed(2)}</span>
                {product.promotionalPrice && (
                  <span className="text-sm line-through text-zinc-600">R$ {Number(product.price).toFixed(2)}</span>
                )}
              </div>
            </div>
            
            <div className="bg-[#0D0D0D] rounded-3xl p-6 border border-white/5 flex flex-col justify-center">
              <span className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-medium">Classificação</span>
              <div className="flex flex-wrap gap-2">
                {product.category && (
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-zinc-300">
                    {product.category}
                  </span>
                )}
                {(product.collections?.name || product.collection) && (
                  <span className="px-3 py-1 bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-full text-sm text-[#FF4D00]">
                    {product.collections?.name || product.collection}
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-[#0D0D0D] rounded-3xl p-6 border border-white/5 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 text-white">
                <Package size={100} />
              </div>
              <span className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-medium">Estoque Total</span>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-3xl font-heading text-white">{totalStock}</span>
                <span className="text-zinc-500 text-sm">unidades</span>
              </div>
            </div>
          </div>

          {/* Atributos Visuais */}
          {(fabrics.length > 0 || colors.length > 0) && (
            <div className="bg-[#0D0D0D] rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-4 font-medium flex items-center gap-2">
                <CheckCircle size={16} className="text-[#FF4D00]" />
                Atributos do Produto
              </h3>
              <div className="flex flex-col sm:flex-row gap-8">
                {colors.length > 0 && (
                  <div>
                    <span className="text-xs text-zinc-600 block mb-3">Cores:</span>
                    <div className="flex flex-wrap gap-2">
                      {colors.map(color => (
                        <span key={color} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {fabrics.length > 0 && (
                  <div>
                    <span className="text-xs text-zinc-600 block mb-3">Malhas:</span>
                    <div className="flex flex-wrap gap-2">
                      {fabrics.map(fabric => (
                        <span key={fabric} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white capitalize">
                          {fabric}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. VARIANTES VISUAIS & INVENTÁRIO (Cards em vez de tabela) */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="bg-[#0D0D0D] rounded-3xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-heading text-white flex items-center gap-2">
                  <LayoutGrid size={18} className="text-[#FF4D00]" />
                  Variantes (SKUs — legado)
                </h3>
                <span className="text-xs text-zinc-500">{product.product_variants.length} variações · estoque em Blanks</span>
              </div>
              
              <div className="space-y-4">
                {product.product_variants.map(variant => {
                  const available = variant.available_stock !== undefined && variant.available_stock !== null ? variant.available_stock : variant.stock || 0;
                  const reserved = variant.reserved_stock || 0;
                  const total = available + reserved;
                  const threshold = variant.low_stock_threshold || 3;
                  
                  const availablePercent = total > 0 ? (available / total) * 100 : 0;
                  const reservedPercent = total > 0 ? (reserved / total) * 100 : 0;
                  
                  const isLowStock = available <= threshold && available > 0;
                  const isOutOfStock = available === 0;

                  return (
                    <div key={variant.id} className="bg-[#050505] rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row md:items-center gap-5 transition-all hover:border-white/10 group">
                      
                      {/* Info da Variante */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-white font-bold">{variant.sku}</span>
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">Esgotado</span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider flex items-center gap-1 animate-pulse">
                              <AlertTriangle size={10} /> Baixo Estoque
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {variant.color && (
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-400 border border-white/5">Cor: <span className="text-white ml-1">{variant.color}</span></span>
                          )}
                          {variant.size && (
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-400 border border-white/5">Tam: <span className="text-white ml-1">{variant.size}</span></span>
                          )}
                        </div>
                      </div>

                      {/* Barra de Estoque Visual */}
                      <div className="flex-1 w-full md:max-w-[240px]">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-emerald-400 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{available} disp.</span>
                          {reserved > 0 && <span className="text-amber-400 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>{reserved} res.</span>}
                        </div>
                        <div className="h-2 w-full bg-[#111] rounded-full overflow-hidden flex shadow-inner relative border border-white/5">
                          {total > 0 ? (
                            <>
                              <div className={`h-full ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${availablePercent}%` }} />
                              <div className="h-full bg-amber-500/50 transition-all duration-500" style={{ width: `${reservedPercent}%` }} />
                            </>
                          ) : (
                            <div className="h-full bg-red-500/30 w-full" />
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center justify-end md:ml-4">
                        <button 
                          type="button"
                          disabled
                          title="Ajuste de estoque legado desativado. Use Estoque → Blanks."
                          className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-zinc-600 cursor-not-allowed text-sm font-medium"
                        >
                          <RefreshCcw size={14} /> Ajustar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Descrição */}
          {product.description && (
            <div className="bg-[#0D0D0D] rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-4 font-medium">Descrição Completa</h3>
              <p className="text-zinc-400 whitespace-pre-wrap text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

        </div>
      </div>

      {/* Modal de Ajuste de Estoque */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => !isAdjusting && setAdjustModalOpen(false)}
        title="Ajuste de Estoque"
        maxWidth="max-w-md"
      >
        {selectedVariant && (
          <form onSubmit={handleAdjustSubmit} className="space-y-6">
            <div className="bg-[#050505] p-5 rounded-2xl border border-white/5 mb-4 text-center shadow-inner">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-medium">Variante selecionada</div>
              <div className="font-heading text-2xl text-white mb-2">{selectedVariant.sku}</div>
              <div className="text-sm text-zinc-400 flex items-center justify-center gap-2">
                Disponível atual: <strong className="text-white text-xl bg-white/10 px-3 py-1 rounded-lg">{selectedVariant.available_stock !== undefined ? selectedVariant.available_stock : (selectedVariant.stock || 0)}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${adjustForm.type === 'add' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-white/5 bg-[#050505] text-zinc-500 hover:border-white/20'}`}>
                <input type="radio" name="adjustType" className="sr-only" checked={adjustForm.type === 'add'} onChange={() => setAdjustForm({...adjustForm, type: 'add'})} />
                <Plus size={24} />
                <span className="font-medium">Entrada</span>
              </label>
              
              <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${adjustForm.type === 'remove' ? 'border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-white/5 bg-[#050505] text-zinc-500 hover:border-white/20'}`}>
                <input type="radio" name="adjustType" className="sr-only" checked={adjustForm.type === 'remove'} onChange={() => setAdjustForm({...adjustForm, type: 'remove'})} />
                <Minus size={24} />
                <span className="font-medium">Saída</span>
              </label>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-zinc-500 mb-2">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                required
                value={adjustForm.quantity}
                onChange={e => setAdjustForm({...adjustForm, quantity: e.target.value})}
                className="input-standard text-center text-2xl font-heading w-full h-14 rounded-xl bg-[#050505] border-white/10 focus:border-[#FF4D00]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-zinc-500 mb-2">
                Motivo
              </label>
              <select
                value={adjustForm.reason}
                onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                className="input-standard w-full h-12 rounded-xl bg-[#050505] border-white/10 text-white"
              >
                <option value="manual_adjustment">Ajuste Manual</option>
                <option value="received">Recebimento de Mercadoria</option>
                <option value="returned">Devolução</option>
                <option value="loss">Perda / Avaria</option>
                <option value="correction">Correção de Inventário</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-zinc-500 mb-2">
                Observações (Opcional)
              </label>
              <textarea
                value={adjustForm.notes}
                onChange={e => setAdjustForm({...adjustForm, notes: e.target.value})}
                className="input-standard w-full h-24 resize-none rounded-xl bg-[#050505] border-white/10 p-3"
                placeholder="Ex: Contagem realizada em 21/05..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="btn-secondary h-12 px-6 rounded-xl font-medium"
                disabled={isAdjusting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary h-12 px-8 rounded-xl font-bold tracking-wide"
                disabled={isAdjusting}
              >
                {isAdjusting ? 'Confirmando...' : 'Confirmar Ajuste'}
              </button>
            </div>
          </form>
        )}
      </Modal>

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
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Editar Produto"
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
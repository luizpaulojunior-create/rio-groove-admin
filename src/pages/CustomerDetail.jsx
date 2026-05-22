import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customersService } from '../services/customers';
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, 
  ShoppingBag, TrendingUp, Star, Clock, AlertCircle,
  Package
} from 'lucide-react';
import { normalizeImageUrl } from '../utils/imageUtils';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await customersService.getCustomerById(id);
      setCustomer(data);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="font-heading text-3xl text-white mb-2">Cliente não encontrado</h2>
        <button 
          onClick={() => navigate('/admin/customers')}
          className="text-[#FF4D00] hover:underline"
        >
          Voltar para a lista
        </button>
      </div>
    );
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Novo': return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
      case 'Recorrente': return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' };
      case 'VIP': return { bg: 'bg-[#FF4D00]/10', text: 'text-[#FF4D00]', border: 'border-[#FF4D00]/20', extra: 'shadow-[0_0_15px_rgba(255,77,0,0.3)]' };
      case 'Inativo': return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
    }
  };

  const badgeStyle = getStatusBadgeStyle(customer.status);

  return (
    <div className="pb-12 space-y-8 max-w-[1400px] mx-auto">
      {/* Header Actions */}
      <button 
        onClick={() => navigate('/admin/customers')}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm uppercase tracking-wider font-medium"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* LADO ESQUERDO: CONTEÚDO PRINCIPAL (65%) */}
        <div className="w-full xl:w-[65%] space-y-8">
          
          {/* HERO CLIENTE */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0D0D0D] rounded-[32px] p-8 md:p-10 border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4D00]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-[#050505] border border-white/10 flex items-center justify-center font-heading text-4xl text-white shadow-xl">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-heading text-4xl text-white tracking-wide">{customer.name}</h1>
                    <span className={`px-3 py-1 rounded-xl text-xs uppercase tracking-wider font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} ${badgeStyle.extra || ''}`}>
                      {customer.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-white/50">
                    {customer.email !== '-' && (
                      <span className="flex items-center gap-2"><Mail size={14}/> {customer.email}</span>
                    )}
                    {customer.phone !== '-' && (
                      <span className="flex items-center gap-2"><Phone size={14}/> {customer.phone}</span>
                    )}
                    {customer.city !== '-' && (
                      <span className="flex items-center gap-2"><MapPin size={14}/> {customer.city}, {customer.state}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-white/5 relative z-10">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Total Gasto</p>
                <p className="font-heading text-3xl text-white">R$ {Number(customer.totalSpent).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Pedidos</p>
                <p className="font-heading text-3xl text-white">{customer.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Ticket Médio</p>
                <p className="font-heading text-3xl text-white">R$ {Number(customer.averageTicket).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Cliente desde</p>
                <p className="font-heading text-2xl text-white mt-1">{new Date(customer.firstOrderDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </motion.div>

          {/* HISTÓRICO DE PEDIDOS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0D0D0D] rounded-[32px] p-8 md:p-10 border border-white/5"
          >
            <h2 className="font-heading text-2xl text-white tracking-widest uppercase mb-8">Histórico de Pedidos</h2>
            
            <div className="space-y-4">
              {customer.orders.map((order) => {
                const orderDate = new Date(order.created_at || order.createdAt);
                const isCancelled = order.status === 'cancelado';
                return (
                  <div 
                    key={order.id} 
                    onClick={() => navigate('/admin/orders')}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-[24px] bg-[#050505] border border-white/[0.03] hover:border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-white group-hover:text-[#FF4D00] transition-colors">
                          Pedido #{order.id.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-white/40 mt-1 flex items-center gap-2">
                          <Calendar size={12} />
                          {orderDate.toLocaleDateString('pt-BR')} às {orderDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                      <p className="font-heading text-xl text-white">
                        R$ {Number(order.total_amount || order.total || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}
                      </p>
                      <span className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold ${isCancelled ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/60'}`}>
                        {order.statusLabel || order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* LADO DIREITO: INSIGHTS (35%) */}
        <div className="w-full xl:w-[35%] space-y-8">
          
          {/* INSIGHTS */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0D0D0D] rounded-[32px] p-8 border border-[#FF4D00]/20 shadow-[0_0_30px_rgba(255,77,0,0.05)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4D00]/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2"></div>
            
            <h2 className="font-heading text-2xl text-[#FF4D00] tracking-widest uppercase mb-6 relative z-10 flex items-center gap-3">
              <Star size={24} />
              Insights
            </h2>

            <div className="space-y-4 relative z-10">
              {customer.insights.map((insight, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-[#050505] border border-white/5">
                  <div className="mt-0.5 text-[#FF4D00]">
                    {insight.toLowerCase().includes('risco') || insight.toLowerCase().includes('inativo') ? (
                      <AlertCircle size={18} className="text-red-500" />
                    ) : insight.toLowerCase().includes('recorrente') || insight.toLowerCase().includes('vip') ? (
                      <TrendingUp size={18} className="text-green-500" />
                    ) : (
                      <Star size={18} />
                    )}
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{insight}</p>
                </div>
              ))}
              
              {customer.insights.length === 0 && (
                <p className="text-white/40 text-sm italic">Aguardando mais dados para gerar insights.</p>
              )}
            </div>
          </motion.div>

          {/* PRODUTOS FAVORITOS */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0D0D0D] rounded-[32px] p-8 border border-white/5"
          >
            <h2 className="font-heading text-2xl text-white tracking-widest uppercase mb-6 flex items-center gap-3">
              <Package size={24} className="text-white/40"/>
              Favoritos
            </h2>

            <div className="space-y-4">
              {customer.favoriteProducts.length > 0 ? (
                customer.favoriteProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-[#050505] border border-white/5">
                    <div className="w-14 h-14 rounded-xl bg-[#0D0D0D] border border-white/5 overflow-hidden flex-shrink-0">
                      {prod.image ? (
                        <img src={normalizeImageUrl(prod.image)} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate" title={prod.name}>{prod.name}</p>
                      <p className="text-xs text-white/40 mt-1">Comprado {prod.quantity}x</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/40 text-sm text-center py-4">Nenhum produto registrado.</p>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

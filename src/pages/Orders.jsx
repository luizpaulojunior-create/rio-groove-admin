import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { 
  Truck, Package, Clock, CheckCircle2, AlertCircle, 
  Loader2, FileText, XCircle, Printer, Copy, 
  Settings, ArrowRight, Search, Filter 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ordersService } from '../services/orders';
import { shippingService } from '../services/shipping';
import { stockService } from '../services/stock';

const TIMELINE_STEPS = [
  { id: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
  { id: 'pagamento_aprovado', label: 'Pagamento Aprovado' },
  { id: 'estoque_reservado', label: 'Estoque Reservado' },
  { id: 'aguardando_producao', label: 'Aguardando Produção' },
  { id: 'em_producao', label: 'Em Produção' },
  { id: 'producao_concluida', label: 'Produção Concluída' },
  { id: 'preparando_envio', label: 'Preparando Envio' },
  { id: 'etiqueta_gerada', label: 'Etiqueta Gerada' },
  { id: 'postado', label: 'Postado' },
  { id: 'em_transito', label: 'Em Trânsito' },
  { id: 'saiu_para_entrega', label: 'Saiu para Entrega' },
  { id: 'entregue', label: 'Entregue' }
];

const STATUS_MAP = {
  'pending': 'aguardando_pagamento',
  'processing': 'preparando_envio',
  'preparando': 'preparando_envio',
  'shipped': 'em_transito',
  'delivered': 'entregue',
  'cancelled': 'cancelado'
};

const STOCK_DEDUCTED_STATUSES = [
  'estoque_reservado', 'aguardando_producao', 'em_producao', 
  'producao_concluida', 'preparando_envio', 'etiqueta_gerada', 
  'postado', 'em_transito', 'saiu_para_entrega', 'entregue',
  'processing', 'preparando', 'shipped', 'delivered'
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos. Tentando novamente...', { toastId: 'fetch-orders' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
let result = [];

if (
  orders &&
  typeof orders[Symbol.iterator] === 'function'
) {
  result = Array.from(orders);
}
    if (statusFilter !== 'all') {
      result = result.filter(order => {
        const normalizedStatus = STATUS_MAP[order.status] || order.status;
        return normalizedStatus === statusFilter;
      });
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt || order.date);
        if (dateFilter === 'today') {
          return orderDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        }
        if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        }
        return true;
      });
    }

    setFilteredOrders(result);
  };

  const getNormalizedStatus = (status) => STATUS_MAP[status] || status;

  const getStatusBadge = (status) => {
    const norm = getNormalizedStatus(status);
    switch (norm) {
      case 'aguardando_pagamento':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1 w-max"><Clock size={12}/> Aguardando Pagamento</span>;
      case 'pagamento_aprovado':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Pagamento Aprovado</span>;
      case 'estoque_reservado':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-teal-500/10 text-teal-500 border-teal-500/20 flex items-center gap-1 w-max"><Package size={12}/> Estoque Reservado</span>;
      case 'aguardando_producao':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-orange-500/10 text-orange-500 border-orange-500/20 flex items-center gap-1 w-max"><Clock size={12}/> Aguardando Produção</span>;
      case 'em_producao':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-orange-500/10 text-orange-500 border-orange-500/20 flex items-center gap-1 w-max"><Loader2 size={12} className="animate-spin"/> Em Produção</span>;
      case 'producao_concluida':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-lime-500/10 text-lime-500 border-lime-500/20 flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Produção Concluída</span>;
      case 'preparando_envio':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-500 border-blue-500/20 flex items-center gap-1 w-max"><Package size={12}/> Preparando Envio</span>;
      case 'etiqueta_gerada':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-500 border-blue-500/20 flex items-center gap-1 w-max"><FileText size={12}/> Etiqueta Gerada</span>;
      case 'postado':
      case 'em_transito':
      case 'saiu_para_entrega':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-purple-500/10 text-purple-500 border-purple-500/20 flex items-center gap-1 w-max"><Truck size={12}/> {TIMELINE_STEPS.find(s => s.id === norm)?.label || 'Em Trânsito'}</span>;
      case 'entregue':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Entregue</span>;
      case 'cancelado':
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1 w-max"><XCircle size={12}/> Cancelado</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-500/10 text-gray-400 border-gray-500/20 flex items-center gap-1 w-max"><AlertCircle size={12}/> Desconhecido</span>;
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Atualizando status...', { toastId: 'update-status' });
      await ordersService.updateOrderStatus(selectedOrder.id, newStatus);
      
      // Se for atualização para estoque reservado, faz a baixa do estoque
      if (newStatus === 'estoque_reservado') {
        toast.update(loadingToast, { render: 'Reservando estoque...', type: 'info', isLoading: true });
        const stockItems = await stockService.getStock();
        const itemsToProcess = selectedOrder.items || [];
        
        for (const item of itemsToProcess) {
          if (!item.color || !item.size) continue;
          const stockItem = stockItems.find(
            s => s.color.toLowerCase() === item.color.toLowerCase() && s.size === item.size
          );
          if (stockItem) {
            try {
              await stockService.adjustStock(stockItem.id, -item.quantity, `Reserva Pedido #${selectedOrder.id}`);
            } catch (stockError) {
              console.error(`Falha ao reservar estoque para item ${item.product?.name}:`, stockError);
              toast.error(`Falha ao reservar estoque para ${item.product?.name || 'item'}`);
            }
          }
        }
      }

      toast.update(loadingToast, { render: `Status atualizado para: ${TIMELINE_STEPS.find(s => s.id === newStatus)?.label || newStatus}`, type: 'success', isLoading: false, autoClose: 3000 });
      fetchOrders();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.dismiss('update-status');
      toast.error('Erro ao atualizar status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (isProcessing) return;
    if (!window.confirm('Deseja realmente cancelar este pedido? O estoque será devolvido caso já tenha sido baixado.')) {
      return;
    }

    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Cancelando pedido e processando devoluções...', { toastId: 'cancel-order' });
      const normStatus = getNormalizedStatus(selectedOrder.status);
      
      // Devolver estoque se já foi deduzido
      if (STOCK_DEDUCTED_STATUSES.includes(normStatus)) {
        const stockItems = await stockService.getStock();
        const itemsToProcess = selectedOrder.items || [];
        
        for (const item of itemsToProcess) {
          if (!item.color || !item.size) continue;
          const stockItem = stockItems.find(
            s => s.color.toLowerCase() === item.color.toLowerCase() && s.size === item.size
          );
          if (stockItem) {
            try {
              await stockService.adjustStock(stockItem.id, item.quantity, `Devolução Cancelamento #${selectedOrder.id}`);
            } catch (stockError) {
               console.error(`Erro ao devolver estoque para ${item.product?.name}:`, stockError);
               toast.error(`Falha ao devolver estoque para ${item.product?.name || 'item'}`);
            }
          }
        }
      }

      await ordersService.updateOrderStatus(selectedOrder.id, 'cancelado');
      toast.update(loadingToast, { render: 'Pedido cancelado com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
      fetchOrders();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast.dismiss('cancel-order');
      toast.error('Erro ao cancelar pedido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateLabel = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Gerando etiqueta...', { toastId: 'generate-label' });
      await shippingService.generateLabel(selectedOrder.id);
      await ordersService.updateOrderStatus(selectedOrder.id, 'etiqueta_gerada');
      toast.update(loadingToast, { render: 'Etiqueta gerada com sucesso! Você já pode imprimi-la.', type: 'success', isLoading: false, autoClose: 4000 });
      fetchOrders();
      setSelectedOrder(prev => ({ ...prev, status: 'etiqueta_gerada' }));
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      toast.dismiss('generate-label');
      toast.error('Erro ao gerar etiqueta.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelLabel = async () => {
    if (isProcessing) return;
    if (!window.confirm('Tem certeza que deseja cancelar esta etiqueta no Melhor Envio?')) return;
    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Cancelando etiqueta...', { toastId: 'cancel-label' });
      await shippingService.cancelLabel(selectedOrder.id);
      await ordersService.updateOrderStatus(selectedOrder.id, 'preparando_envio');
      toast.update(loadingToast, { render: 'Etiqueta cancelada com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
      fetchOrders();
      setSelectedOrder(prev => ({ ...prev, status: 'preparando_envio' }));
    } catch (error) {
      console.error('Erro ao cancelar etiqueta:', error);
      toast.dismiss('cancel-label');
      toast.error('Erro ao cancelar etiqueta. Verifique se ela já foi postada ou cancelada.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintLabel = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Buscando etiqueta...', { toastId: 'print-label' });
      const data = await shippingService.printLabel([selectedOrder.id]);
      if (data && data.url) {
        toast.update(loadingToast, { render: 'Abrindo etiqueta...', type: 'success', isLoading: false, autoClose: 2000 });
        window.open(data.url, '_blank');
      } else {
        toast.update(loadingToast, { render: 'Etiqueta não encontrada ou ainda não liberada para impressão.', type: 'error', isLoading: false, autoClose: 4000 });
      }
    } catch (error) {
      console.error('Erro ao imprimir etiqueta:', error);
      toast.dismiss('print-label');
      toast.error('Erro ao imprimir etiqueta. Verifique no Melhor Envio.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const getNextActions = () => {
    if (!selectedOrder) return [];
    const norm = getNormalizedStatus(selectedOrder.status);

    const actions = [];
    
    if (norm === 'aguardando_pagamento') {
      actions.push(<button key="ap" onClick={() => handleUpdateStatus('pagamento_aprovado')} disabled={isProcessing} className="w-full py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle2 size={16} />Aprovar Pagamento</button>);
    }
    
    if (norm === 'pagamento_aprovado') {
      actions.push(<button key="er" onClick={() => handleUpdateStatus('estoque_reservado')} disabled={isProcessing} className="w-full py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><Package size={16} />Reservar Estoque</button>);
    }

    if (norm === 'estoque_reservado') {
      actions.push(<button key="aprod" onClick={() => handleUpdateStatus('aguardando_producao')} disabled={isProcessing} className="w-full py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><ArrowRight size={16} />Enviar para Produção</button>);
    }

    if (norm === 'aguardando_producao') {
      actions.push(<button key="eprod" onClick={() => handleUpdateStatus('em_producao')} disabled={isProcessing} className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><Loader2 size={16} />Iniciar Produção</button>);
    }

    if (norm === 'em_producao') {
      actions.push(<button key="cprod" onClick={() => handleUpdateStatus('producao_concluida')} disabled={isProcessing} className="w-full py-2 bg-lime-600 text-white rounded-xl text-sm font-medium hover:bg-lime-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle2 size={16} />Concluir Produção</button>);
    }

    if (norm === 'producao_concluida') {
      actions.push(<button key="pe" onClick={() => handleUpdateStatus('preparando_envio')} disabled={isProcessing} className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><Package size={16} />Preparar Envio</button>);
    }

    if (norm === 'preparando_envio') {
      actions.push(<button key="ge" onClick={generateLabel} disabled={isProcessing} className="w-full py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors glow-red flex items-center justify-center gap-2 disabled:opacity-50"><FileText size={16} />Gerar Etiqueta Correios/Jadlog</button>);
    }

    if (norm === 'etiqueta_gerada') {
      actions.push(<button key="pos" onClick={() => handleUpdateStatus('postado')} disabled={isProcessing} className="w-full py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><Truck size={16} />Marcar como Postado</button>);
      actions.push(<button key="cel" onClick={cancelLabel} disabled={isProcessing} className="w-full py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><XCircle size={16} />Cancelar Etiqueta</button>);
    }

    if (norm === 'postado') {
      actions.push(<button key="et" onClick={() => handleUpdateStatus('em_transito')} disabled={isProcessing} className="w-full py-2 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><Truck size={16} />Marcar Em Trânsito</button>);
    }

    if (norm === 'em_transito') {
      actions.push(<button key="spe" onClick={() => handleUpdateStatus('saiu_para_entrega')} disabled={isProcessing} className="w-full py-2 bg-purple-400 text-white rounded-xl text-sm font-medium hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><Truck size={16} />Saiu para Entrega</button>);
    }

    if (norm === 'saiu_para_entrega') {
      actions.push(<button key="ent" onClick={() => handleUpdateStatus('entregue')} disabled={isProcessing} className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle2 size={16} />Marcar como Entregue</button>);
    }

    return actions;
  };

  const columns = [
    {
      header: 'Pedido',
      accessor: 'id',
      render: (row) => <span className="font-heading text-xl text-[var(--color-primary)]">#{row.id}</span>
    },
    {
      header: 'Cliente',
      accessor: 'customer',
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.customer?.name || row.customerName || '-'}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{row.customer?.email || row.customerEmail || '-'}</p>
        </div>
      )
    },
    {
      header: 'Data',
      accessor: 'createdAt',
      render: (row) => new Date(row.createdAt || row.date || new Date()).toLocaleString('pt-BR')
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (row) => <span className="font-medium text-white">R$ {Number(row.total || 0).toFixed(2)}</span>
    },
    {
      header: 'Ações',
      accessor: 'actions',
      render: (row) => (
        <button 
          onClick={() => handleViewOrder(row)}
          className="text-sm px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          Detalhes Operacionais
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="font-heading text-4xl">Workflow de Pedidos</h1>
        
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none min-w-[160px]"
            >
              <option value="all">Todos os Status</option>
              {TIMELINE_STEPS.map(step => (
                <option key={step.id} value={step.id}>{step.label}</option>
              ))}
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none min-w-[140px]"
          >
            <option value="all">Todo o Periodo</option>
            <option value="today">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Últimos 30 dias</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          searchPlaceholder="Buscar por ID, Cliente, CPF..."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Detalhes do Pedido #${selectedOrder?.id}`}
        maxWidth="max-w-6xl"
      >
        {selectedOrder && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              
              {/* Timeline Operacional */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-heading tracking-wide mb-6 border-b border-[var(--color-border)] pb-2 text-white flex items-center gap-2">
                  <Clock size={20} className="text-[var(--color-primary)]"/>
                  Timeline Operacional
                </h3>
                
                <div className="relative flex justify-between items-center px-4 overflow-x-auto pb-4 hide-scrollbar">
                  {/* Linha conectora */}
                  <div className="absolute top-4 left-6 right-6 h-[2px] bg-[var(--color-border)] -z-10"></div>
                  
                  {TIMELINE_STEPS.map((step, idx) => {
                    const normStatus = getNormalizedStatus(selectedOrder.status);
                    const currentIndex = TIMELINE_STEPS.findIndex(s => s.id === normStatus);
                    const isCompleted = idx <= currentIndex && normStatus !== 'cancelado';
                    const isCurrent = idx === currentIndex && normStatus !== 'cancelado';
                    
                    return (
                      <div key={step.id} className="flex flex-col items-center min-w-[100px] gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isCurrent ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-[0_0_15px_rgba(255,42,42,0.5)]' : 
                          isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                          'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                        }`}>
                          {isCompleted && !isCurrent ? <CheckCircle2 size={16} /> : <span className="text-xs">{idx + 1}</span>}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider text-center font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-[var(--color-text-muted)]' : 'text-[rgba(255,255,255,0.2)]'}`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Produtos e Produção */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-heading tracking-wide mb-4 border-b border-[var(--color-border)] pb-2 text-white flex items-center gap-2">
                  <Package size={20} className="text-[var(--color-primary)]"/>
                  Itens & Produção
                </h3>
                <div className="space-y-4">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                      <div className="w-20 h-20 bg-[rgba(255,255,255,0.05)] rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {item.product?.images?.[0] ? <img src={item.product.images[0].url || item.product.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Package size={24} />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-white text-lg">{item.product?.name || item.name || 'Produto sem nome'}</p>
                            <p className="text-sm text-[var(--color-text-muted)]">SKU: {item.product?.sku || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white text-lg">R$ {(item.quantity * item.price).toFixed(2)}</p>
                            <p className="text-sm text-[var(--color-text-muted)]">{item.quantity}x R$ {Number(item.price).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[rgba(0,0,0,0.2)] p-2 rounded-lg text-sm border border-[var(--color-border)]">
                          <div>
                            <span className="block text-[10px] uppercase text-[var(--color-text-muted)] mb-0.5">Cor</span>
                            <span className="font-medium text-white">{item.color || '-'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-[var(--color-text-muted)] mb-0.5">Tamanho</span>
                            <span className="font-medium text-white">{item.size || '-'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-[var(--color-text-muted)] mb-0.5">Estoque Base</span>
                            <span className={STOCK_DEDUCTED_STATUSES.includes(getNormalizedStatus(selectedOrder.status)) ? "text-teal-400 font-medium" : "text-yellow-500 font-medium"}>
                              {STOCK_DEDUCTED_STATUSES.includes(getNormalizedStatus(selectedOrder.status)) ? 'Consumido' : 'Pendente'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-[var(--color-text-muted)] mb-0.5">Estampa</span>
                            <span className="font-medium text-white">{item.product?.printType || 'Frente'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Nenhum item encontrado.</p>
                  )}
                </div>
              </div>

            </div>

            <div className="space-y-6">
              
              {/* Ações Rápidas */}
              <div className="glass-panel p-6 border-[var(--color-primary)] border-opacity-30">
                <h3 className="text-lg font-heading tracking-wide mb-4 border-b border-[var(--color-border)] pb-2 text-white flex items-center gap-2">
                  <Settings size={20} className="text-[var(--color-primary)]"/>
                  Ações Operacionais
                </h3>
                <div className="space-y-3">
                  {getNormalizedStatus(selectedOrder.status) !== 'cancelado' && getNextActions()}
                  
                  <div className="pt-3 mt-3 border-t border-[var(--color-border)] space-y-3">
                    <select 
                      disabled={isProcessing}
                      onChange={(e) => {
                        if(e.target.value) {
                          handleUpdateStatus(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-white rounded-xl text-sm px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
                    >
                      <option value="">Forçar Mudança de Status...</option>
                      {TIMELINE_STEPS.map(step => (
                        <option key={step.id} value={step.id}>{step.label}</option>
                      ))}
                    </select>

                    <button onClick={handlePrintLabel} disabled={isProcessing} className="w-full py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-white rounded-xl text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      <Printer size={16} /> Imprimir Etiqueta (Melhor Envio)
                    </button>
                    
                    {getNormalizedStatus(selectedOrder.status) !== 'cancelado' && (
                      <button onClick={handleCancelOrder} disabled={isProcessing} className="w-full py-2 bg-[var(--color-surface)] border border-red-500/30 text-red-500 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        <XCircle size={16} /> Cancelar Pedido e Devolver Estoque
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logística */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-heading tracking-wide mb-4 border-b border-[var(--color-border)] pb-2 text-white flex items-center gap-2">
                  <Truck size={20} className="text-[var(--color-primary)]"/>
                  Logística
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[var(--color-text-muted)] text-xs uppercase block">Endereço de Entrega</span>
                    <p className="text-white mt-1">
                      {selectedOrder.shippingInfo?.address || selectedOrder.address || 'Não informado'}<br/>
                      {selectedOrder.shippingInfo?.city || selectedOrder.city} - {selectedOrder.shippingInfo?.state || selectedOrder.state}<br/>
                      CEP: {selectedOrder.shippingInfo?.zipCode || selectedOrder.zipCode}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)] text-xs uppercase block">Método de Envio</span>
                    <p className="text-white mt-1 capitalize">{selectedOrder.shippingInfo?.method || selectedOrder.shippingMethod || 'Correios/Jadlog'}</p>
                  </div>
                  {selectedOrder.trackingCode && (
                    <div className="pt-2 border-t border-[var(--color-border)] flex justify-between items-center">
                      <div>
                        <span className="text-[var(--color-text-muted)] text-xs uppercase block">Código de Rastreio</span>
                        <p className="text-white mt-1 font-medium">{selectedOrder.trackingCode}</p>
                      </div>
                      <button onClick={() => copyToClipboard(selectedOrder.trackingCode)} className="p-2 bg-[var(--color-surface)] rounded-lg hover:text-[var(--color-primary)] transition-colors">
                        <Copy size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Cliente */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-heading tracking-wide mb-4 border-b border-[var(--color-border)] pb-2 text-white">
                  Cliente
                </h3>
                <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
                  <p className="font-medium text-white">{selectedOrder.customer?.name || selectedOrder.customerName || '-'}</p>
                  <p>CPF: {selectedOrder.customer?.cpf || selectedOrder.cpf || '-'}</p>
                  <div className="flex justify-between items-center group">
                    <p>{selectedOrder.customer?.email || selectedOrder.customerEmail || '-'}</p>
                    <button onClick={() => copyToClipboard(selectedOrder.customer?.email || selectedOrder.customerEmail)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--color-primary)] transition-all"><Copy size={12}/></button>
                  </div>
                  <p>{selectedOrder.customer?.phone || selectedOrder.phone || '-'}</p>
                </div>
              </div>

              {/* Logs Operacionais */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-heading tracking-wide mb-4 border-b border-[var(--color-border)] pb-2 text-white flex items-center gap-2">
                  <FileText size={20} className="text-[var(--color-primary)]"/>
                  Histórico & Logs
                </h3>
                <div className="space-y-3">
                  {(selectedOrder.logs || []).map((log, idx) => (
                    <div key={idx} className="text-xs border-l-2 border-[var(--color-primary)] pl-3 py-1">
                      <p className="text-white font-medium">{log.action}</p>
                      <div className="flex justify-between text-[var(--color-text-muted)] mt-1">
                        <span>{log.user || 'Sistema'}</span>
                        <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                      {log.details && <p className="text-[var(--color-text-muted)] mt-1">{log.details}</p>}
                    </div>
                  ))}
                  {(!selectedOrder.logs || selectedOrder.logs.length === 0) && (
                    <div className="text-xs border-l-2 border-[var(--color-primary)] pl-3 py-1">
                      <p className="text-white font-medium">Pedido criado</p>
                      <div className="flex justify-between text-[var(--color-text-muted)] mt-1">
                        <span>Sistema</span>
                        <span>{new Date(selectedOrder.createdAt || selectedOrder.date).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

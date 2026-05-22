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
import { normalizeImageUrl } from '../utils/imageUtils';

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
  const [manualTrackingCode, setManualTrackingCode] = useState('');
  
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

  const getOrderActiveIndex = (order) => {
    if (!order) return 0;
    const normStatus = getNormalizedStatus(order.timelineStep || order.status);
    const isCancelled = normStatus === 'cancelado' || normStatus === 'cancelled';
    let activeIdx = TIMELINE_STEPS.findIndex(s => s.id === normStatus);
    if (isCancelled || activeIdx === -1) {
      let lastIdx = -1;
      const allLogsStr = JSON.stringify(order.logs || []).toLowerCase();
      TIMELINE_STEPS.forEach((step, i) => {
        if (allLogsStr.includes(step.id.toLowerCase()) || allLogsStr.includes(step.label.toLowerCase())) {
          if (i > lastIdx) lastIdx = i;
        }
      });
      activeIdx = lastIdx >= 0 ? lastIdx : 0;
    }
    return activeIdx;
  };

  const getStatusBadge = (status) => {
    const norm = getNormalizedStatus(status);
    const badgeClass = "px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1 w-fit whitespace-nowrap";
    
    const pendenteStatus = ['pending', 'pending_payment', 'aguardando_pagamento', 'pendente'];
    const canceladoStatus = ['cancelado', 'cancelled'];
    const aprovadoStatus = [
      'pagamento_aprovado', 'estoque_reservado', 'aguardando_producao', 
      'em_producao', 'producao_concluida', 'preparando_envio', 
      'etiqueta_gerada', 'postado', 'em_transito', 'saiu_para_entrega', 
      'entregue', 'processing', 'preparando', 'shipped', 'delivered'
    ];

    if (canceladoStatus.includes(norm)) {
      return <span className={`${badgeClass} bg-red-500/10 text-red-500 border-red-500/20`}><XCircle size={10}/> Cancelado</span>;
    }
    if (pendenteStatus.includes(norm)) {
      return <span className={`${badgeClass} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`}><Clock size={10}/> Pendente</span>;
    }
    if (aprovadoStatus.includes(norm)) {
      return <span className={`${badgeClass} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`}><CheckCircle2 size={10}/> Aprovado</span>;
    }
    
    return <span className={`${badgeClass} bg-gray-500/10 text-gray-400 border-gray-500/20`}><AlertCircle size={10}/> Desconhecido</span>;
  };

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setManualTrackingCode(order.trackingCode || order.tracking_code || '');
    setIsModalOpen(true);

    // Tracking Automático: Polling silencioso ao abrir o pedido
    const norm = getNormalizedStatus(order.timelineStep || order.status);
    const code = order.trackingCode || order.tracking_code;

    if (code && !['entregue', 'cancelado'].includes(norm)) {
      try {
        const tracking = await shippingService.trackShipment(code);
        if (tracking && tracking.status && tracking.status !== norm) {
          await updateOrderStatus(order.id, tracking.status, `Rastreamento atualizado automaticamente: ${tracking.status}`);
        }
      } catch (error) {
        console.log('Polling de rastreio falhou ou indisponível', error);
      }
    }
  };

  const updateOrderStatus = async (orderId, newStatus, customLogMessage = null, extraData = {}) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      
      const currentOrder = orders.find(o => o.id === orderId) || selectedOrder;

      const normalizeColor = (c) => String(c || '').toLowerCase().trim().replace(/preto/g, 'preta');
      const normalizeSize = (s) => String(s || '').toUpperCase().trim();

      if (newStatus === 'estoque_reservado' && currentOrder) {
        const stockItems = await stockService.getStock();
        const itemsToProcess = currentOrder.items || [];
        
        for (const item of itemsToProcess) {
          if (!item.color || !item.size || item.color === '-' || item.size === '-') continue;
          
          const stockItem = stockItems.find(
            s => normalizeColor(s.color) === normalizeColor(item.color) && normalizeSize(s.size) === normalizeSize(item.size)
          );
          
          if (!stockItem) {
             toast.error(`Falta de Estoque: Lote para a cor ${item.color} e tamanho ${item.size} não encontrado.`);
             setIsProcessing(false);
             return;
          }
          
          if (stockItem.quantity <= 0 || stockItem.quantity < item.quantity) {
             toast.error(`Falta de Estoque: Apenas ${stockItem.quantity} disponíveis de ${item.color} - ${item.size}.`);
             setIsProcessing(false);
             return;
          }
        }
      }

      const stepLabel = TIMELINE_STEPS.find(s => s.id === newStatus)?.label || newStatus;
      let logMsg = customLogMessage;
      if (!logMsg) {
        if (newStatus === 'estoque_reservado') {
          logMsg = 'Estoque reservado automaticamente';
        } else if (newStatus === 'em_producao') {
          logMsg = 'Pedido entrou em produção';
        } else if (newStatus === 'cancelado') {
          logMsg = 'Pedido cancelado';
        } else {
          logMsg = `Status alterado para: ${stepLabel}`;
        }
      }

      const loadingToast = toast.loading(`Atualizando para ${stepLabel}...`, { toastId: `update-status-${orderId}` });
      
      await ordersService.updateOrderStatus(orderId, newStatus, extraData);
      
      if (newStatus === 'estoque_reservado' && currentOrder) {
        toast.update(loadingToast, { render: 'Reservando estoque...', type: 'info', isLoading: true });
        const stockItems = await stockService.getStock();
        const itemsToProcess = currentOrder.items || [];
        
        for (const item of itemsToProcess) {
          if (!item.color || !item.size || item.color === '-' || item.size === '-') continue;
          const stockItem = stockItems.find(
            s => normalizeColor(s.color) === normalizeColor(item.color) && normalizeSize(s.size) === normalizeSize(item.size)
          );
          if (stockItem) {
            try {
              await stockService.adjustStock(stockItem.id, -item.quantity, `Reserva Pedido #${orderId}`);
            } catch (stockError) {
              console.error(`Falha ao reservar estoque para item ${item.product?.name}:`, stockError);
              toast.error(`Falha ao reservar estoque para ${item.product?.name || 'item'}`);
            }
          }
        }
      }

      if (newStatus === 'cancelado' && currentOrder) {
        toast.update(loadingToast, { render: 'Cancelando pedido e processando devoluções...', type: 'info', isLoading: true });
        const normStatus = getNormalizedStatus(currentOrder.status);
        if (STOCK_DEDUCTED_STATUSES.includes(normStatus)) {
          const stockItems = await stockService.getStock();
          const itemsToProcess = currentOrder.items || [];
          for (const item of itemsToProcess) {
            if (!item.color || !item.size || item.color === '-' || item.size === '-') continue;
            const stockItem = stockItems.find(
              s => normalizeColor(s.color) === normalizeColor(item.color) && normalizeSize(s.size) === normalizeSize(item.size)
            );
            if (stockItem) {
              try {
                await stockService.adjustStock(stockItem.id, item.quantity, `Devolução Cancelamento #${orderId}`);
              } catch (stockError) {
                 console.error(`Erro ao devolver estoque para ${item.product?.name}:`, stockError);
              }
            }
          }
        }
      }

      toast.update(loadingToast, { render: `Status atualizado para: ${stepLabel}`, type: 'success', isLoading: false, autoClose: 3000 });
      
      const newLog = {
        id: Date.now(),
        action: logMsg,
        message: logMsg,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        user: 'Operador / Sistema',
      };

      setOrders(prevOrders => prevOrders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            timelineStep: newStatus,
            ...extraData,
            logs: [...(order.logs || []), newLog]
          };
        }
        return order;
      }));
      
      setSelectedOrder(prev => {
        if (prev && prev.id === orderId) {
          return {
            ...prev,
            status: newStatus,
            timelineStep: newStatus,
            ...extraData,
            logs: [...(prev.logs || []), newLog]
          };
        }
        return prev;
      });

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.dismiss(`update-status-${orderId}`);
      toast.error('Erro ao atualizar status.');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = (newStatus) => {
    updateOrderStatus(selectedOrder.id, newStatus);
  };

  const handleCancelOrder = () => {
    if (isProcessing) return;
    if (!window.confirm('Deseja realmente cancelar este pedido? O estoque será devolvido caso já tenha sido baixado.')) {
      return;
    }
    updateOrderStatus(selectedOrder.id, 'cancelado');
  };

  const handleSaveTracking = async () => {
    if (!manualTrackingCode || !manualTrackingCode.trim()) {
      toast.error('Digite um código de rastreio válido.');
      return;
    }
    try {
      await updateOrderStatus(selectedOrder.id, 'etiqueta_gerada', `Código de rastreio inserido: ${manualTrackingCode}`, { tracking_code: manualTrackingCode });
      toast.success('Rastreamento salvo!');
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const getNextActions = () => {
    if (!selectedOrder) return [];
    
    const activeIdx = getOrderActiveIndex(selectedOrder);
    const stepId = TIMELINE_STEPS[activeIdx]?.id;

    const actions = [];
    
    if (stepId === 'aguardando_pagamento') {
      actions.push(<button key="ap" onClick={() => handleUpdateStatus('pagamento_aprovado')} disabled={isProcessing} className="w-full h-12 bg-[#22C55E] text-white rounded-2xl text-[14px] font-medium hover:bg-[#1ea951] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"><CheckCircle2 size={18} />Aprovar Pagamento</button>);
    }
    
    if (stepId === 'pagamento_aprovado') {
      actions.push(<button key="er" onClick={() => handleUpdateStatus('estoque_reservado')} disabled={isProcessing} className="w-full h-12 bg-[#FF4D00] text-white rounded-2xl text-[14px] font-medium hover:bg-[#e64500] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,77,0,0.3)]"><Package size={18} />Reservar Estoque</button>);
    }

    if (stepId === 'estoque_reservado') {
      actions.push(<button key="aprod" onClick={() => handleUpdateStatus('aguardando_producao')} disabled={isProcessing} className="w-full h-12 bg-[#EAB308] text-black rounded-2xl text-[14px] font-medium hover:bg-[#dca506] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]"><ArrowRight size={18} />Enviar para Produção</button>);
    }

    if (stepId === 'aguardando_producao') {
      actions.push(<button key="eprod" onClick={() => handleUpdateStatus('em_producao')} disabled={isProcessing} className="w-full h-12 bg-[#EAB308] text-black rounded-2xl text-[14px] font-medium hover:bg-[#dca506] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]"><Loader2 size={18} />Iniciar Produção</button>);
    }

    if (stepId === 'em_producao') {
      actions.push(<button key="cprod" onClick={() => handleUpdateStatus('producao_concluida')} disabled={isProcessing} className="w-full h-12 bg-[#22C55E] text-white rounded-2xl text-[14px] font-medium hover:bg-[#1ea951] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"><CheckCircle2 size={18} />Concluir Produção</button>);
    }

    if (stepId === 'producao_concluida') {
      actions.push(<button key="pe" onClick={() => handleUpdateStatus('preparando_envio')} disabled={isProcessing} className="w-full h-12 bg-[#FF4D00] text-white rounded-2xl text-[14px] font-medium hover:bg-[#e64500] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,77,0,0.3)]"><Package size={18} />Preparar Envio</button>);
    }

    if (stepId === 'preparando_envio') {
      actions.push(<button key="ge" onClick={() => window.open('https://melhorenvio.com.br/carrinho', '_blank')} disabled={isProcessing} className="w-full h-12 bg-[#FF4D00] text-white rounded-2xl text-[14px] font-medium hover:bg-[#e64500] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,77,0,0.3)]"><Printer size={18} />Gerar Etiqueta</button>);
    }

    return actions;
  };

  const columns = [
    {
      header: 'Pedido',
      accessor: 'id',
      render: (row) => {
        const idStr = String(row.id || '');
        return (
          <button 
            onClick={() => handleViewOrder(row)}
            className="font-heading text-sm text-[var(--color-primary)] whitespace-nowrap cursor-pointer hover:text-red-400 hover:drop-shadow-[0_0_8px_rgba(255,42,42,0.6)] transition-all text-left" 
            title={`Ver detalhes do pedido #${idStr}`}
          >
            #{idStr}
          </button>
        );
      }
    },
    {
      header: 'Cliente',
      accessor: 'customer',
      render: (row) => (
        <div className="max-w-[200px] xl:max-w-[300px]">
          <p className="font-medium text-white text-sm truncate" title={String(row.customer?.name || row.customer_name || row.customerName || '-')}>
            {String(row.customer?.name || row.customer_name || row.customerName || '-')}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] truncate" title={String(row.customer?.email || row.customer_email || row.customerEmail || '-')}>
            {String(row.customer?.email || row.customer_email || row.customerEmail || '-')}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const rawStatus = getNormalizedStatus(row.status || row.payment_status || row.paymentStatus || '');
        
        let type = 'PENDENTE';
        let label = 'PENDENTE';
        
        const aprovadoStatus = [
          'paid', 'approved', 'pagamento_aprovado', 'estoque_reservado', 'aguardando_producao', 
          'em_producao', 'producao_concluida', 'preparando_envio', 
          'etiqueta_gerada', 'postado', 'em_transito', 'saiu_para_entrega', 
          'entregue', 'processing', 'preparando', 'shipped', 'delivered'
        ];
        
        const canceladoStatus = ['cancelled', 'rejected', 'refunded', 'cancelado'];
        
        if (aprovadoStatus.includes(rawStatus)) {
          type = 'PAGO';
          label = 'PAGO';
        } else if (canceladoStatus.includes(rawStatus)) {
          type = 'CANCELADO';
          label = 'CANCELADO';
        }
        
        return (
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            {type === 'PAGO' && (
              <div className="h-[32px] rounded-full px-3.5 w-fit flex items-center gap-1.5 bg-[#22C55E]/10 border border-[#22C55E]/20 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                <CheckCircle2 size={14} className="text-[#22C55E]" />
                <span className="font-sans font-medium text-[12px] tracking-wide text-[#22C55E]">{label}</span>
              </div>
            )}
            {type === 'PENDENTE' && (
              <div className="h-[32px] rounded-full px-3.5 w-fit flex items-center gap-1.5 bg-[#EAB308]/10 border border-[#EAB308]/20 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                <Clock size={14} className="text-[#EAB308]" />
                <span className="font-sans font-medium text-[12px] tracking-wide text-[#EAB308]">{label}</span>
              </div>
            )}
            {type === 'CANCELADO' && (
              <div className="h-[32px] rounded-full px-3.5 w-fit flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                <XCircle size={14} className="text-red-400" />
                <span className="font-sans font-medium text-[12px] tracking-wide text-red-400">{label}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Data',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-sm whitespace-nowrap text-[var(--color-text-muted)]">
          {new Date(row.createdAt || row.date || new Date()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      )
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (row) => <span className="font-medium text-white text-sm whitespace-nowrap">R$ {Number(row.total || 0).toFixed(2)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h1 className="font-heading text-3xl sm:text-4xl whitespace-nowrap">Workflow de Pedidos</h1>
        
        <div className="flex flex-1 w-full xl:justify-end items-center gap-3">
          <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto hide-scrollbar">
            <div className="relative min-w-[140px] flex-1 xl:flex-none">
              <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none"
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
              className="min-w-[120px] flex-1 xl:flex-none bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none"
            >
              <option value="all">Todo o Período</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="[&_table]:min-w-[1000px] xl:[&_table]:min-w-[1400px] [&_.max-w-md]:!max-w-full lg:[&_.max-w-md]:!max-w-2xl xl:[&_.max-w-md]:!max-w-3xl">
          <DataTable
            columns={columns}
            data={filteredOrders}
            searchPlaceholder="Buscar por ID, Cliente, CPF..."
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`PEDIDO #${selectedOrder?.id}`}
        maxWidth="max-w-[1200px]"
      >
        {selectedOrder && (
          <div className="flex flex-col xl:flex-row gap-[24px] max-w-full pb-4">
            
            {/* COLUNA ESQUERDA (65%) */}
            <div className="w-full xl:w-[65%] space-y-6">
              
              {/* 1. STATUS DO PEDIDO */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-8">Status do Pedido</h2>
                
                <div className="relative flex justify-between items-start px-2 overflow-x-auto pb-6 custom-scrollbar">
                  {(() => {
                    const normStatus = getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status);
                    const isCancelled = normStatus === 'cancelado' || normStatus === 'cancelled';
                    const activeIdx = getOrderActiveIndex(selectedOrder);

                    const opSteps = TIMELINE_STEPS.slice(0, 8); // Até Etiqueta Gerada

                    return opSteps.map((step, idx) => {
                      const isCompleted = idx < activeIdx;
                      const isCurrent = !isCancelled && idx === activeIdx;
                      const isCancelledStep = isCancelled && idx === activeIdx;

                      let circleStyle = "w-4 h-4 rounded-full transition-all duration-300 z-10 relative shrink-0 ";
                      let lineClass = "absolute top-2 -translate-y-1/2 left-[50%] w-full h-[2px] -z-0 ";

                      if (isCurrent) {
                        circleStyle += "bg-[#22C55E] ring-4 ring-[#22C55E]/20 shadow-[0_0_15px_rgba(34,197,94,0.5)]";
                        lineClass += "bg-[rgba(255,255,255,0.06)]";
                      } else if (isCompleted) {
                        circleStyle += "bg-[#22C55E]";
                        lineClass += "bg-[#22C55E] opacity-50";
                      } else if (isCancelledStep) {
                        circleStyle += "bg-red-500 ring-4 ring-red-500/20";
                        lineClass += "bg-red-500 opacity-50";
                      } else {
                        circleStyle += "bg-[#EAB308] opacity-50";
                        lineClass += "bg-[rgba(255,255,255,0.06)]";
                      }

                      return (
                        <div key={step.id} className="relative flex-1 flex flex-col items-center min-w-[100px] gap-3">
                          {idx < opSteps.length - 1 && (
                            <div className={lineClass}></div>
                          )}
                          <div className={circleStyle}></div>
                          <span className={`text-[12px] font-sans font-medium text-center px-1 leading-tight ${isCurrent ? 'text-[#22C55E]' : (isCompleted ? 'text-white/80' : 'text-white/40')}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* 2. ITENS DO PEDIDO */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Itens do Pedido</h2>
                
                <div className="space-y-4">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-5 p-4 bg-[#050505] rounded-2xl border border-[rgba(255,255,255,0.06)]">
                      <div className="w-[88px] h-[88px] bg-[#0D0D0D] rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-[rgba(255,255,255,0.03)]">
                        {(item.product?.images?.[0] || item.image) ? <img src={normalizeImageUrl(item.product?.images?.[0]?.url || item.product?.images?.[0] || item.image)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Package size={24} className="text-white/20"/>}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-sans font-medium text-[16px] text-white leading-tight">{String(item.product?.name || item.name || item.title || 'Produto sem nome')}</p>
                            <p className="font-sans text-[12px] text-white/50 mt-1">SKU: {String(item.product?.sku || item.sku || 'N/A')}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="font-sans font-medium text-[16px] text-white">R$ {((Number(item.quantity) || 1) * (Number(item.price) || 0)).toFixed(2)}</p>
                            <p className="font-sans text-[12px] text-white/50 mt-1">{Number(item.quantity) || 1}x R$ {Number(item.price || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-6 mt-auto">
                          <div>
                            <span className="block font-sans text-[10px] uppercase text-white/50 mb-0.5 tracking-wider">Cor</span>
                            <span className="font-sans text-[14px] text-white/80">{String(item.color || '-')}</span>
                          </div>
                          <div>
                            <span className="block font-sans text-[10px] uppercase text-white/50 mb-0.5 tracking-wider">Tamanho</span>
                            <span className="font-sans text-[14px] text-white/80">{String(item.size || '-')}</span>
                          </div>
                          <div>
                            <span className="block font-sans text-[10px] uppercase text-white/50 mb-0.5 tracking-wider">Estoque Base</span>
                            <span className={`font-sans text-[14px] ${STOCK_DEDUCTED_STATUSES.includes(getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status)) ? "text-[#22C55E]" : "text-[#EAB308]"}`}>
                              {STOCK_DEDUCTED_STATUSES.includes(getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status)) ? 'Baixado' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <p className="font-sans text-[14px] text-white/40 text-center py-4">Nenhum item encontrado.</p>
                  )}
                </div>
              </div>

              {/* 3. ACOMPANHAMENTO DA ENTREGA */}
              {(() => {
                const normStatus = getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status);
                const isCancelled = normStatus === 'cancelado' || normStatus === 'cancelled';
                const activeIdx = getOrderActiveIndex(selectedOrder);
                
                const isAfterEtiqueta = activeIdx >= 7 && !isCancelled;
                
                return (
                  <div className={`bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm transition-all duration-500 ${isAfterEtiqueta ? 'ring-1 ring-[#22C55E]/30 shadow-[0_0_30px_rgba(34,197,94,0.05)]' : 'opacity-80'}`}>
                    <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Acompanhamento da Entrega</h2>
                    
                    <div className="space-y-0 pl-2">
                      {TIMELINE_STEPS.slice(8).map((step, relativeIdx, arr) => {
                        const idx = relativeIdx + 8;
                        const isCompleted = idx < activeIdx;
                        const isCurrent = !isCancelled && idx === activeIdx;
                        const isCancelledStep = isCancelled && idx === activeIdx;

                        let dotStyle = "w-3 h-3 rounded-full relative z-10 transition-all duration-300 ";
                        let trackStyle = "absolute left-[5px] top-3 bottom-[-24px] w-[2px] ";

                        if (isCurrent) {
                          dotStyle += "bg-[#22C55E] ring-4 ring-[#22C55E]/20 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
                          trackStyle += "bg-[rgba(255,255,255,0.06)]";
                        } else if (isCompleted) {
                          dotStyle += "bg-[#22C55E]";
                          trackStyle += "bg-[#22C55E] opacity-30";
                        } else if (isCancelledStep) {
                          dotStyle += "bg-red-500";
                          trackStyle += "bg-transparent";
                        } else {
                          dotStyle += "bg-[#EAB308] opacity-30";
                          trackStyle += "bg-[rgba(255,255,255,0.06)]";
                        }

                        return (
                          <div key={step.id} className="relative flex gap-6">
                            {relativeIdx < arr.length - 1 && <div className={trackStyle}></div>}
                            <div className="pt-1.5 shrink-0">
                              <div className={dotStyle}></div>
                            </div>
                            <div className={`pb-8 w-full ${isCurrent ? 'bg-[#050505] p-4 rounded-2xl border border-[rgba(34,197,94,0.15)] -mt-2' : ''}`}>
                              <p className={`font-sans text-[14px] font-medium ${isCurrent ? 'text-[#22C55E]' : (isCompleted ? 'text-white' : 'text-white/40')}`}>{step.label}</p>
                              {isCurrent && step.id === 'postado' && <p className="font-sans text-[12px] text-[#22C55E]/70 mt-1">Pedido recebido pela transportadora.</p>}
                              {isCurrent && step.id === 'em_transito' && <p className="font-sans text-[12px] text-[#22C55E]/70 mt-1">Pedido em deslocamento.</p>}
                              {isCurrent && step.id === 'saiu_para_entrega' && <p className="font-sans text-[12px] text-[#22C55E]/70 mt-1">O entregador está a caminho.</p>}
                              {isCurrent && step.id === 'entregue' && <p className="font-sans text-[12px] text-[#22C55E]/70 mt-1">Pedido entregue ao destinatário.</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* COLUNA DIREITA (35%) */}
            <div className="w-full xl:w-[35%] space-y-6">
              
              {/* 1. AÇÕES OPERACIONAIS */}
              {(() => {
                const normStatus = getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status);
                const isCancelled = normStatus === 'cancelado' || normStatus === 'cancelled';
                const activeIdx = getOrderActiveIndex(selectedOrder);
                
                // Exibir somente antes de "Etiqueta Gerada" (índice 7) se houver ação
                if (!isCancelled && activeIdx < 7) {
                  const actions = getNextActions();
                  if (actions.length > 0) {
                    return (
                      <div className="bg-[#0D0D0D] border border-[#FF4D00]/20 rounded-[24px] p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)]">
                        <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-[#FF4D00] mb-6">Ações Operacionais</h2>
                        <div className="space-y-4">
                          {actions}
                        </div>
                      </div>
                    );
                  }
                }
                
                if (isCancelled) {
                  return (
                     <div className="bg-[#0D0D0D] border border-red-500/20 rounded-[24px] p-6">
                      <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-red-500 mb-2">Pedido Cancelado</h2>
                      <p className="font-sans text-[12px] text-white/50">As operações para este pedido foram encerradas.</p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 2. LOGÍSTICA & ENVIO */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Logística & Envio</h2>
                
                <div className="space-y-4">
                  <div className="bg-[#050505] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)] flex flex-col gap-3">
                    <span className="block font-sans text-[10px] uppercase text-white/50 tracking-wider">Código de Rastreio</span>
                    <div className="flex gap-2 items-center">
                      {selectedOrder.trackingCode || selectedOrder.tracking_code ? (
                        <p className="font-sans text-[18px] text-white font-bold tracking-widest">{selectedOrder.trackingCode || selectedOrder.tracking_code}</p>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <input 
                            type="text" 
                            value={manualTrackingCode}
                            onChange={(e) => setManualTrackingCode(e.target.value)}
                            placeholder="Ex: BR123456789"
                            className="w-full bg-[#0D0D0D] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[12px] text-white focus:outline-none focus:border-[#FF4D00] transition-colors"
                          />
                          <button 
                            onClick={handleSaveTracking}
                            disabled={isProcessing || !manualTrackingCode.trim()}
                            className="px-4 py-2 bg-[#FF4D00] text-white rounded-xl text-[12px] font-medium hover:bg-[#e64500] transition-colors disabled:opacity-50 shrink-0"
                          >
                            Salvar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#050505] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)]">
                      <span className="block font-sans text-[10px] uppercase text-white/50 mb-1 tracking-wider">Método de Envio</span>
                      <p className="font-sans text-[14px] text-white capitalize">{String(selectedOrder.shippingInfo?.method || selectedOrder.shippingMethod || selectedOrder.shipping_method || 'Correios/Jadlog')}</p>
                    </div>
                    <div className="bg-[#050505] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)]">
                      <span className="block font-sans text-[10px] uppercase text-white/50 mb-1 tracking-wider">Valor do Frete</span>
                      <p className="font-sans text-[14px] text-white font-medium">R$ {Number(selectedOrder.shippingInfo?.price || selectedOrder.shipping_price || selectedOrder.shippingPrice || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-[#050505] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)]">
                    <span className="block font-sans text-[10px] uppercase text-white/50 mb-1 tracking-wider">Endereço de Entrega</span>
                    <p className="font-sans text-[14px] text-white/80 leading-relaxed mt-2">
                      {String(selectedOrder.shippingInfo?.address || selectedOrder.shipping_street || selectedOrder.address?.street || 'Não informado')}
                      {String(selectedOrder.shipping_number || selectedOrder.address?.number ? `, ${selectedOrder.shipping_number || selectedOrder.address?.number}` : '')}<br/>
                      {String(selectedOrder.shippingInfo?.city || selectedOrder.shipping_city || selectedOrder.address?.city || '-')} - {String(selectedOrder.shippingInfo?.state || selectedOrder.shipping_state || selectedOrder.address?.state || '-')}<br/>
                      CEP: {String(selectedOrder.shippingInfo?.zipCode || selectedOrder.shipping_cep || selectedOrder.address?.cep || '-')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. CLIENTE */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Cliente</h2>
                
                <div className="space-y-4">
                  <p className="font-sans text-[16px] text-white font-medium">{String(selectedOrder.customer?.name || selectedOrder.customer_name || selectedOrder.customerName || '-')}</p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center bg-[#050505] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                      <span className="font-sans text-[12px] text-white/50">CPF</span>
                      <span className="font-sans text-[14px] text-white/90">{String(selectedOrder.customer?.cpf || selectedOrder.customer_cpf || selectedOrder.cpf || '-')}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#050505] p-3 rounded-xl border border-[rgba(255,255,255,0.06)] group">
                      <span className="font-sans text-[12px] text-white/50">Email</span>
                      <div className="flex gap-2 items-center">
                        <span className="font-sans text-[14px] text-white/90">{String(selectedOrder.customer?.email || selectedOrder.customer_email || selectedOrder.customerEmail || '-')}</span>
                        <button onClick={() => copyToClipboard(selectedOrder.customer?.email || selectedOrder.customer_email || selectedOrder.customerEmail)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#FF4D00] transition-all"><Copy size={12}/></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-[#050505] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                      <span className="font-sans text-[12px] text-white/50">Telefone</span>
                      <span className="font-sans text-[14px] text-white/90">{String(selectedOrder.customer?.phone || selectedOrder.customer_phone || selectedOrder.phone || '-')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. HISTÓRICO & LOGS */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Histórico & Logs</h2>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {(selectedOrder.logs || []).slice().reverse().map((log, idx) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-[#FF4D00]/30 pb-4 last:pb-0">
                      <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#FF4D00]"></div>
                      <p className="font-sans text-[14px] text-white/90">{String(log.action || log.message || 'Atualização de pedido')}</p>
                      <div className="flex gap-3 text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                        <span>{String(log.user || 'Sistema')}</span>
                        <span>&bull;</span>
                        <span>{new Date(log.createdAt || log.created_at || new Date()).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                  {(!selectedOrder.logs || selectedOrder.logs.length === 0) && (
                    <div className="relative pl-4 border-l-2 border-[#FF4D00]/30">
                      <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#FF4D00]"></div>
                      <p className="font-sans text-[14px] text-white/90">Pedido criado</p>
                      <div className="flex gap-3 text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                        <span>Sistema</span>
                        <span>&bull;</span>
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

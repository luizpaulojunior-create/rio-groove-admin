import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Truck, AlertCircle, CheckCircle2, Box, MapPin, Printer, Calculator, Copy, RefreshCw } from 'lucide-react';
import { shippingService } from '../services/shipping';
import { toast } from 'react-toastify';

export default function Shipping() {
  const [isConnected, setIsConnected] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tracking
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  
  // Quotes
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({ postalCode: '', weight: '0.5', length: '20', width: '15', height: '10' });
  const [quoteResults, setQuoteResults] = useState([]);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    checkConnection();
    fetchShipments();
  }, []);

  const checkConnection = async () => {
    try {
      const status = await shippingService.getConnectionStatus();
      setIsConnected(status?.connected === true);
    } catch (error) {
      console.error('Erro ao verificar status OAuth:', error);
      setIsConnected(false);
    }
  };

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const data = await shippingService.getShipments();
      setShipments(data || []);
    } catch (error) {
      console.error('Erro ao buscar envios:', error);
      if (error.response?.status === 401) {
        setIsConnected(false);
      } else {
        toast.error('Erro ao carregar envios.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const data = await shippingService.getOAuthUrl();
      if (data && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro ao obter URL OAuth:', error);
      toast.error('Erro ao conectar com Melhor Envio.');
    }
  };

  const handleTrackShipment = async (trackingCode) => {
    setTrackingModalOpen(true);
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const data = await shippingService.trackShipment(trackingCode);
      setTrackingData(data);
    } catch (error) {
      console.error('Erro ao rastrear:', error);
      toast.error('Não foi possível carregar o rastreamento.');
      setTrackingModalOpen(false);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handlePrintLabel = async (id) => {
    try {
      const loadingToast = toast.loading('Buscando etiqueta...');
      const data = await shippingService.printLabel([id]);
      if (data && data.url) {
        toast.update(loadingToast, { render: 'Abrindo etiqueta...', type: 'success', isLoading: false, autoClose: 2000 });
        window.open(data.url, '_blank');
      } else {
        toast.update(loadingToast, { render: 'Etiqueta não encontrada ou não liberada.', type: 'error', isLoading: false, autoClose: 4000 });
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast.dismiss();
      toast.error('Erro ao imprimir etiqueta.');
    }
  };

  const handleCalculateQuote = async (e) => {
    e.preventDefault();
    if (quoteLoading) return;
    setQuoteLoading(true);
    setQuoteResults([]);
    try {
      const data = await shippingService.calculateQuote({
        postalCode: quoteData.postalCode,
        weight: parseFloat(quoteData.weight),
        dimensions: {
          length: parseFloat(quoteData.length),
          width: parseFloat(quoteData.width),
          height: parseFloat(quoteData.height)
        }
      });
      setQuoteResults(data || []);
      toast.success('Cotação calculada com sucesso!');
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      toast.error('Erro ao calcular frete.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const columns = [
    { header: 'ID Etiqueta', accessor: 'id', render: (row) => <span className="font-heading text-[var(--color-primary)] tracking-wider">{row.id}</span> },
    { header: 'Pedido', accessor: 'orderId', render: (row) => `#${row.orderId || row.order_id}` },
    { header: 'Transportadora', accessor: 'method', render: (row) => <span className="font-medium text-white">{row.method || row.company?.name || '-'}</span> },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        const s = (row.status || '').toLowerCase();
        let colorClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        if (s === 'delivered' || s === 'entregue') colorClass = 'bg-green-500/10 text-green-500 border-green-500/20';
        else if (s === 'posted' || s === 'postado' || s === 'in_transit') colorClass = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        else if (s === 'canceled' || s === 'cancelado') colorClass = 'bg-red-500/10 text-red-500 border-red-500/20';
        
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium border ${colorClass} capitalize`}>
            {s.replace('_', ' ')}
          </span>
        );
      }
    },
    { header: 'Custo', accessor: 'cost', render: (row) => `R$ ${Number(row.cost || row.price || 0).toFixed(2)}` },
    { header: 'Rastreio', accessor: 'tracking', render: (row) => row.tracking || row.tracking_code || '-' },
    {
      header: 'Ações',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          {(row.tracking || row.tracking_code) && (
            <button 
              onClick={() => handleTrackShipment(row.tracking || row.tracking_code)} 
              className="p-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors" 
              title="Rastrear"
            >
              <MapPin size={16} />
            </button>
          )}
          <button 
            onClick={() => handlePrintLabel(row.id)} 
            className="p-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors" 
            title="Imprimir Etiqueta"
          >
            <Printer size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-4xl mb-1 flex items-center gap-3">
            Logística & Envios
            {isConnected ? (
              <span className="text-xs font-sans font-medium px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12}/> Integrado Melhor Envio
              </span>
            ) : (
              <span className="text-xs font-sans font-medium px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center gap-1">
                <AlertCircle size={12}/> Desconectado
              </span>
            )}
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">Gestão centralizada de fretes, etiquetas e rastreamento.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setQuoteModalOpen(true)}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:border-[var(--color-primary)] transition-colors flex items-center gap-2"
          >
            <Calculator size={18} />
            Simular Frete
          </button>
          
          <button 
            onClick={fetchShipments}
            className="p-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:text-[var(--color-primary)] transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={18} />
          </button>

          {!isConnected && (
            <button onClick={handleConnect} className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors glow-red flex items-center gap-2">
              <Truck size={18} />
              Conectar OAuth
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[var(--color-text-muted)] text-sm font-medium mb-2">Aguardando Envio</p>
                  <h3 className="font-heading text-4xl">{shipments.filter(s => ['pending', 'aguardando'].includes(s.status?.toLowerCase())).length}</h3>
                </div>
                <Box className="text-[var(--color-primary)]" size={24} />
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[var(--color-text-muted)] text-sm font-medium mb-2">Etiquetas Pendentes</p>
                  <h3 className="font-heading text-4xl text-yellow-500">{shipments.filter(s => ['label_generated', 'generated'].includes(s.status?.toLowerCase())).length}</h3>
                </div>
                <AlertCircle className="text-yellow-500" size={24} />
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[var(--color-text-muted)] text-sm font-medium mb-2">Em Trânsito</p>
                  <h3 className="font-heading text-4xl text-blue-500">{shipments.filter(s => ['in_transit', 'posted'].includes(s.status?.toLowerCase())).length}</h3>
                </div>
                <Truck className="text-blue-500" size={24} />
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[var(--color-text-muted)] text-sm font-medium mb-2">Entregas do Mês</p>
                  <h3 className="font-heading text-4xl text-green-500">{shipments.filter(s => ['delivered', 'entregue'].includes(s.status?.toLowerCase())).length}</h3>
                </div>
                <CheckCircle2 className="text-green-500" size={24} />
              </div>
            </div>
          </div>

          <h3 className="font-heading text-2xl mt-8 mb-4 border-b border-[var(--color-border)] pb-2">Últimos Envios</h3>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={shipments}
              searchPlaceholder="Buscar por rastreio ou ID..."
            />
          )}
        </>
      )}

      {/* Modal de Simulação de Frete */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        title="Simular Cotação Melhor Envio"
      >
        <div className="space-y-6">
          <form onSubmit={handleCalculateQuote} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-[var(--color-text-muted)] mb-1">CEP de Destino</label>
                <input 
                  type="text" 
                  value={quoteData.postalCode} 
                  onChange={e => setQuoteData({...quoteData, postalCode: e.target.value})}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-white focus:border-[var(--color-primary)] outline-none"
                  placeholder="00000-000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-[var(--color-text-muted)] mb-1">Peso (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={quoteData.weight} 
                  onChange={e => setQuoteData({...quoteData, weight: e.target.value})}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-white focus:border-[var(--color-primary)] outline-none"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase text-[var(--color-text-muted)] mb-1">Comprimento (cm)</label>
                <input 
                  type="number" 
                  value={quoteData.length} 
                  onChange={e => setQuoteData({...quoteData, length: e.target.value})}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-white focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-[var(--color-text-muted)] mb-1">Largura (cm)</label>
                <input 
                  type="number" 
                  value={quoteData.width} 
                  onChange={e => setQuoteData({...quoteData, width: e.target.value})}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-white focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-[var(--color-text-muted)] mb-1">Altura (cm)</label>
                <input 
                  type="number" 
                  value={quoteData.height} 
                  onChange={e => setQuoteData({...quoteData, height: e.target.value})}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-white focus:border-[var(--color-primary)] outline-none"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={quoteLoading}
              className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors flex items-center justify-center gap-2"
            >
              {quoteLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Calculator size={18} /> Calcular</>}
            </button>
          </form>

          {quoteResults.length > 0 && (
            <div className="pt-6 border-t border-[var(--color-border)] space-y-3">
              <h4 className="font-heading text-lg mb-4">Opções Disponíveis</h4>
              {quoteResults.map((quote, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Truck size={24} className={quote.company?.name === 'Correios' ? 'text-yellow-500' : 'text-blue-500'} />
                    <div>
                      <p className="font-medium text-white">{quote.company?.name || 'Transportadora'} - {quote.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Entrega em até {quote.delivery_time || quote.custom_delivery_time} dias úteis</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-lg text-[var(--color-primary)]">R$ {Number(quote.custom_price || quote.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Rastreamento */}
      <Modal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        title="Rastreamento do Envio"
      >
        <div className="space-y-6">
          {trackingLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[var(--color-text-muted)]">Buscando informações logísticas...</p>
            </div>
          ) : trackingData ? (
            <div>
              <div className="flex justify-between items-center mb-6 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                <div>
                  <span className="block text-xs text-[var(--color-text-muted)] uppercase mb-1">Código de Rastreio</span>
                  <p className="font-heading text-xl text-white tracking-wider">{trackingData.tracking || trackingData.tracking_code || trackingData.id || '-'}</p>
                </div>
                <button onClick={() => copyToClipboard(trackingData.tracking || trackingData.tracking_code || trackingData.id)} className="p-2 bg-[rgba(255,255,255,0.05)] rounded-lg hover:text-[var(--color-primary)] transition-colors">
                  <Copy size={18} />
                </button>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-border)] before:to-transparent">
                {(trackingData.events || trackingData.tracking_events || []).map((event, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Truck size={14} />
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-[var(--color-primary)]">{event.status || event.title}</span>
                      </div>
                      <p className="text-sm text-white mb-2">{event.location || event.description}</p>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {event.date ? new Date(event.date).toLocaleString('pt-BR') : event.created_at ? new Date(event.created_at).toLocaleString('pt-BR') : ''}
                      </span>
                    </div>
                  </div>
                ))}
                {(!trackingData.events && !trackingData.tracking_events) && (
                  <div className="text-center py-8 text-[var(--color-text-muted)]">
                    Nenhum evento logístico encontrado para este rastreio.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              Não foi possível carregar os dados de rastreamento.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

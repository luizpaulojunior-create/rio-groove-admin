import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Loader2, Palette, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import {
  CUSTOM_ORDER_STATUSES,
  customOrdersService,
  formatInsumoLabel,
} from '../services/customOrders';

function statusLabel(id) {
  return CUSTOM_ORDER_STATUSES.find((s) => s.id === id)?.label || id;
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'Todos os pedidos' },
  ...CUSTOM_ORDER_STATUSES.map((s) => ({ id: s.id, label: s.label })),
];

function nextStatusId(currentId) {
  const idx = CUSTOM_ORDER_STATUSES.findIndex((s) => s.id === currentId);
  const nextIdx = idx < 0 ? 0 : (idx + 1) % CUSTOM_ORDER_STATUSES.length;
  return CUSTOM_ORDER_STATUSES[nextIdx].id;
}

function nextFilterId(currentId) {
  const idx = FILTER_OPTIONS.findIndex((f) => f.id === currentId);
  const nextIdx = idx < 0 ? 0 : (idx + 1) % FILTER_OPTIONS.length;
  return FILTER_OPTIONS[nextIdx].id;
}

function filterLabel(id) {
  return FILTER_OPTIONS.find((f) => f.id === id)?.label || 'Todos os pedidos';
}

export default function CustomOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [status, setStatus] = useState('received');
  const [mockupFile, setMockupFile] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customOrdersService.getOrders(statusFilter);
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar pedidos personalizados.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.protocol?.toLowerCase().includes(q)
      || o.contact_name?.toLowerCase().includes(q)
      || o.contact_email?.toLowerCase().includes(q)
    );
  });

  async function openDetail(order) {
    let detail = order;
    try {
      detail = (await customOrdersService.getOrder(order.id)) || order;
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível carregar o detalhe completo.');
    }
    setSelected(detail);
    setAdminNotes(detail.admin_notes || '');
    setQuoteAmount(detail.quote_amount != null ? String(detail.quote_amount) : '');
    setStatus(detail.status || 'received');
    setMockupFile(null);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await customOrdersService.updateOrder(
        selected.id,
        {
          status,
          admin_notes: adminNotes,
          quote_amount: quoteAmount ? Number(quoteAmount) : '',
        },
        mockupFile,
      );
      toast.success('Pedido atualizado.');
      setSelected(updated);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar pedido.');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      header: 'Protocolo',
      accessor: 'protocol',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openDetail(row);
          }}
          className="font-mono text-sm text-primary hover:text-red-400 hover:underline transition-all text-left"
          title={`Ver pedido ${row.protocol}`}
        >
          {row.protocol}
        </button>
      ),
    },
    {
      header: 'Cliente',
      accessor: 'contact_name',
      render: (row) => (
        <div>
          <p className="text-white">{row.contact_name}</p>
          <p className="text-xs text-gray-500">{row.contact_email}</p>
        </div>
      ),
    },
    {
      header: 'Insumo',
      accessor: 'insumo',
      render: (row) => (
        <div>
          <p>{formatInsumoLabel(row)}</p>
          <p className="text-xs text-gray-500">{row.model}</p>
        </div>
      ),
    },
    {
      header: 'Qtd',
      accessor: 'quantity',
    },
    {
      header: 'Tipo',
      accessor: 'order_type',
      render: (row) => (row.order_type === 'ready_art' ? 'Arte pronta' : 'Arte exclusiva'),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className="text-xs uppercase tracking-wide text-primary">{statusLabel(row.status)}</span>
      ),
    },
    {
      header: 'Data',
      accessor: 'created_at',
      render: (row) => new Date(row.created_at).toLocaleDateString('pt-BR'),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading tracking-wider flex items-center gap-3">
            <Palette className="w-8 h-8 text-primary" />
            Personalizados
          </h1>
          <p className="text-gray-500 mt-1">Pedidos DTF — camisa, regata, cropped, boné, caneca e acessório.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar protocolo, nome ou e-mail..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs text-gray-500 uppercase tracking-wider">Filtrar</span>
          <span className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white min-w-[8.5rem] text-center">
            {filterLabel(statusFilter)}
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter(nextFilterId(statusFilter))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-sm text-gray-300 hover:border-primary/40 hover:text-white transition-colors whitespace-nowrap"
            title="Passar para o próximo filtro de status"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Use &quot;Próximo&quot; para alternar o filtro da lista (todos → recebido → em análise…). Dentro do pedido, o mesmo botão muda o status do cliente.
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          hideToolbar
          onRowClick={openDetail}
        />
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Pedido ${selected?.protocol || ''}`}>
        {selected && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cliente</p>
                <p>{selected.contact_name}</p>
                <p className="text-gray-400">{selected.contact_email}</p>
                <p className="text-gray-400">{selected.contact_phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Produto</p>
                <p>{formatInsumoLabel(selected)} — {selected.model}</p>
                <p className="text-gray-400">{selected.genero} · Qtd {selected.quantity}</p>
                <p className="text-gray-400">Cor: {selected.blank_color || '—'}</p>
              </div>
            </div>

            {selected.brief_description && (
              <div>
                <p className="text-gray-500 text-sm mb-1">Brief</p>
                <p className="text-sm whitespace-pre-wrap">{selected.brief_description}</p>
              </div>
            )}

            {selected.customer_notes && (
              <div>
                <p className="text-gray-500 text-sm mb-1">Observações do cliente</p>
                <p className="text-sm">{selected.customer_notes}</p>
              </div>
            )}

            {selected.print_placements?.length > 0 && (
              <div>
                <p className="text-gray-500 text-sm mb-1">Áreas de impressão</p>
                <p className="text-sm">{Array.isArray(selected.print_placements) ? selected.print_placements.join(', ') : selected.print_placements}</p>
              </div>
            )}

            {selected.size_breakdown && Object.keys(selected.size_breakdown).length > 0 && (
              <div>
                <p className="text-gray-500 text-sm mb-1">Grade de tamanhos</p>
                <p className="text-sm font-mono">
                  {Object.entries(selected.size_breakdown)
                    .filter(([, q]) => Number(q) > 0)
                    .map(([size, q]) => `${size}: ${q}`)
                    .join(' · ')}
                </p>
              </div>
            )}

            {selected.custom_order_files?.length > 0 && (
              <div>
                <p className="text-gray-500 text-sm mb-2">Arquivos e estampas</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selected.custom_order_files.map((f) => {
                    const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(f.file_name || f.storage_url || '');
                    return (
                      <div key={f.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                          {f.kind === 'customer_art' ? 'Arte do cliente' : f.kind === 'reference' ? 'Referência' : f.kind === 'mockup' ? 'Mockup' : f.kind}
                        </p>
                        {isImage && f.storage_url ? (
                          <a href={f.storage_url} target="_blank" rel="noreferrer" className="block mb-2">
                            <img
                              src={f.storage_url}
                              alt={f.file_name || 'Arte'}
                              className="w-full max-h-40 object-contain rounded bg-black/40"
                            />
                          </a>
                        ) : null}
                        <a href={f.storage_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">
                          {f.file_name || 'Abrir arquivo'}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-500 mb-2">Status</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="inline-flex px-4 py-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary font-medium text-sm">
                  {statusLabel(status)}
                </span>
                <button
                  type="button"
                  onClick={() => setStatus(nextStatusId(status))}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 bg-white/5 text-white text-sm hover:border-primary/40 hover:bg-primary/10 transition-colors"
                >
                  Próximo status
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Clique em &quot;Próximo status&quot; para avançar (recebido → em análise → orçamento…). Depois, Salvar.
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Orçamento (R$)</label>
              <input
                type="number"
                step="0.01"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Notas internas</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Upload mockup</label>
              <input type="file" accept="image/*" onChange={(e) => setMockupFile(e.target.files?.[0] || null)} />
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-full py-3 rounded-lg bg-primary text-black font-medium flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, ImagePlus, Loader2, MessageCircle, Palette, Search, Truck, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import {
  buildAdminWhatsAppUrl,
  CUSTOM_ORDER_STATUSES,
  customOrdersService,
  formatInsumoLabel,
} from '../services/customOrders';
import { getOrderDisplayPricing } from '../config/customPricing';

function statusLabel(id) {
  return CUSTOM_ORDER_STATUSES.find((s) => s.id === id)?.label || id;
}

function formatCepInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function cepDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 8);
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatShippingDeadline(option) {
  const days =
    parseInt(String(option.custom_delivery_time), 10)
    || parseInt(String(option.delivery_days), 10)
    || parseInt(String(option.delivery_time), 10)
    || 0;
  if (days <= 0) {
    const raw = String(option.delivery_time || '').trim();
    if (raw && !/^\d+$/.test(raw)) return raw;
    return 'Prazo a calcular';
  }
  if (days === 1) return '1 dia útil';
  return `${days} dias úteis`;
}

function paymentBadge(status) {
  const map = {
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    not_required: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  };
  const label = {
    paid: 'Pago',
    pending: 'Pendente',
    not_required: 'N/A',
  };
  const cls = map[status] || map.pending;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] uppercase tracking-wide ${cls}`}>
      {label[status] || status || '—'}
    </span>
  );
}

function paymentPill(label, status) {
  const map = {
    paid: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    pending: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
    not_required: 'border-white/10 bg-white/5 text-gray-500',
  };
  const text = {
    paid: 'Pago',
    pending: 'Pend.',
    not_required: '—',
  };
  const cls = map[status] || map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap ${cls}`}
      title={`${label}: ${text[status] || status || 'pendente'}`}
    >
      <span className="text-gray-500 font-normal">{label}</span>
      <span className="font-semibold uppercase">{text[status] || status || '?'}</span>
    </span>
  );
}

function PaymentStatusCell({ row }) {
  const items = [];
  if (row.order_type === 'exclusive_art') {
    items.push({ label: 'Arte', status: row.art_payment_status });
  }
  items.push({ label: 'Peça', status: row.product_payment_status });
  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.map((item) => (
        <span key={item.label}>{paymentPill(item.label, item.status)}</span>
      ))}
    </div>
  );
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'Todos os pedidos' },
  ...CUSTOM_ORDER_STATUSES.map((s) => ({ id: s.id, label: s.label })),
];

const TIMELINE = [
  { id: 'received', label: 'Recebido' },
  { id: 'reviewing', label: 'Análise' },
  { id: 'mockup_ready', label: 'Mockup' },
  { id: 'art_paid', label: 'Arte paga' },
  { id: 'awaiting_product_payment', label: 'Peça' },
  { id: 'in_production', label: 'Produção' },
  { id: 'shipped', label: 'Enviado' },
  { id: 'completed', label: 'Concluído' },
];

function timelineForOrder(order) {
  if (order?.order_type === 'ready_art') {
    return TIMELINE.filter((s) => !['mockup_ready', 'art_paid'].includes(s.id));
  }
  return TIMELINE;
}

function statusIndex(status, steps) {
  const idx = steps.findIndex((s) => s.id === status);
  return idx >= 0 ? idx : 0;
}

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

function MockupUploadField({ file, onChange, orderType }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const hint = orderType === 'ready_art'
    ? 'Após enviar, o cliente pode pagar a peça (preço fixo + frete).'
    : 'Após enviar, o status vai para Mockup pronto e o cliente paga a taxa de arte.';

  return (
    <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <ImagePlus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Enviar mockup para o cliente</p>
          <p className="text-xs text-gray-400 mt-1">{hint}</p>
        </div>
      </div>

      <label className="flex flex-col items-center gap-2 cursor-pointer rounded-lg border border-white/10 bg-black/30 px-4 py-6 hover:border-primary/40 transition-colors">
        <Upload className="w-6 h-6 text-primary" />
        <span className="text-sm text-white">Clique ou arraste a imagem do mockup</span>
        <span className="text-xs text-gray-500">PNG, JPG ou WEBP</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="sr-only"
        />
      </label>

      {file && (
        <div className="rounded-lg border border-primary/30 bg-black/40 p-3 flex items-center gap-3">
          {preview ? (
            <img src={preview} alt="Preview mockup" className="w-16 h-16 object-contain rounded bg-black/60" />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">{file.name}</p>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-gray-400 hover:text-white mt-1"
            >
              Remover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderTimeline({ order, currentStatus }) {
  const steps = useMemo(() => timelineForOrder(order), [order]);
  const activeIdx = statusIndex(currentStatus, steps);

  return (
    <div className="flex flex-wrap gap-1">
      {steps.map((step, idx) => {
        const done = idx < activeIdx || currentStatus === 'completed';
        const active = step.id === currentStatus;
        return (
          <div
            key={step.id}
            className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide border ${
              active
                ? 'border-primary bg-primary/15 text-primary'
                : done
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/10 bg-white/5 text-gray-500'
            }`}
          >
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

export default function CustomOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [shippingAmount, setShippingAmount] = useState('');
  const [shippingCep, setShippingCep] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [shippingServiceId, setShippingServiceId] = useState('');
  const [shippingQuoteOptions, setShippingQuoteOptions] = useState([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [status, setStatus] = useState('received');
  const [mockupFile, setMockupFile] = useState(null);
  const [mpPaymentId, setMpPaymentId] = useState('');
  const [reconcileLoading, setReconcileLoading] = useState(false);

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
    setShippingAmount(detail.shipping_amount != null ? String(detail.shipping_amount) : '');
    setShippingCep(formatCepInput(detail.shipping_cep || ''));
    setShippingMethod(detail.shipping_method || '');
    setShippingServiceId(detail.shipping_service_id || '');
    setShippingQuoteOptions([]);
    setStatus(detail.status || 'received');
    setMockupFile(null);
    setMpPaymentId('');
  }

  async function handleReconcilePayment() {
    if (!selected || !mpPaymentId.trim()) {
      toast.warn('Informe o ID do pagamento no Mercado Pago.');
      return;
    }
    setReconcileLoading(true);
    try {
      const result = await customOrdersService.reconcilePayment(selected.id, mpPaymentId.trim());
      if (result.reconciled) {
        toast.success(result.alreadyPaid ? 'Pagamento já estava sincronizado.' : 'Pagamento sincronizado com sucesso.');
        const updated = result.order || (await customOrdersService.getOrder(selected.id));
        setSelected(updated);
        setStatus(updated?.status || status);
        fetchOrders();
      } else {
        toast.warn(result.reason || 'Pagamento ainda não aprovado no Mercado Pago.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Erro ao sincronizar pagamento.');
    } finally {
      setReconcileLoading(false);
    }
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
        },
        mockupFile,
      );
      toast.success('Pedido atualizado.');
      setSelected(updated);
      setStatus(updated.status || status);
      setMockupFile(null);
      fetchOrders();
    } catch (err) {
      console.error(err);
      const isTimeout =
        err.code === 'ECONNABORTED' || /timeout/i.test(String(err.message || ''));
      toast.error(
        isTimeout
          ? 'O servidor demorou para responder (upload do mockup). Tente de novo em alguns segundos.'
          : err.response?.data?.error || err.message || 'Erro ao salvar pedido.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleQuoteShipping() {
    if (!selected) return;
    const cep = cepDigits(shippingCep);
    if (cep.length !== 8) {
      toast.warn('Informe o CEP de entrega (8 dígitos).');
      return;
    }
    setQuoteLoading(true);
    try {
      const result = await customOrdersService.quoteShipping(selected.id, cep);
      setShippingQuoteOptions(result?.options || []);
      if (result?.cep) setShippingCep(formatCepInput(result.cep));
      if (!result?.options?.length) {
        toast.warn('Nenhuma opção de frete retornada pelo Melhor Envio.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Erro ao cotar frete.');
    } finally {
      setQuoteLoading(false);
    }
  }

  function applyShippingOption(option) {
    setShippingAmount(String(Number(option.price) || 0));
    setShippingMethod(option.label || `${option.company} / ${option.name}`);
    setShippingServiceId(String(option.id || option.service_code || ''));
  }

  async function handleIncrementRevision() {
    if (!selected) return;
    const max = Number(selected.max_revisions) || 3;
    const current = Number(selected.revision_count) || 0;
    if (current >= max) {
      toast.warn('Limite de revisões atingido.');
      return;
    }
    setRevisionLoading(true);
    try {
      const updated = await customOrdersService.incrementRevision(selected.id);
      toast.success('Revisão registrada.');
      setSelected(updated);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao registrar revisão.');
    } finally {
      setRevisionLoading(false);
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
      header: 'Pagamentos',
      accessor: 'art_payment_status',
      render: (row) => <PaymentStatusCell row={row} />,
    },
    {
      header: 'Data',
      accessor: 'created_at',
      render: (row) => new Date(row.created_at).toLocaleDateString('pt-BR'),
    },
  ];

  const detailTotal = selected ? getOrderDisplayPricing(selected).productTotal : null;
  const displayPricing = selected ? getOrderDisplayPricing(selected) : null;

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
        Use &quot;Próximo&quot; para alternar o filtro da lista. No pedido, avance o status manualmente ou envie o mockup para avançar automaticamente.
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
                <p className="text-gray-400 mt-1">
                  {selected.order_type === 'ready_art' ? 'Arte pronta' : 'Arte exclusiva'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
              <p className="text-xs uppercase tracking-wider text-gray-500">Preços fixos — sem orçamento manual</p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {selected.order_type === 'exclusive_art' && (
                  <div>
                    <p className="text-gray-500 text-xs">Taxa de arte</p>
                    <p className="font-medium">{formatMoney(displayPricing?.artFee ?? selected.art_fee_amount)}</p>
                    <div className="mt-1">{paymentBadge(selected.art_payment_status)}</div>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 text-xs">Peça (un.)</p>
                  <p className="font-medium">{formatMoney(displayPricing?.productUnit ?? selected.product_unit_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Frete</p>
                  <p className="font-medium">
                    {selected.shipping_method
                      ? formatMoney(selected.shipping_amount || 0)
                      : 'Cliente escolhe no pagamento'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total peça + frete</p>
                  <p className="font-medium text-primary">{formatMoney(detailTotal)}</p>
                  <div className="mt-1">{paymentBadge(selected.product_payment_status)}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2">
                <p className="text-xs uppercase tracking-wider text-gray-500">Sincronizar Mercado Pago</p>
                <p className="text-xs text-gray-500">
                  Se o valor entrou no MP mas o admin não atualizou, cole o <strong className="text-gray-300">ID do pagamento</strong> (número da transação) e sincronize.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={mpPaymentId}
                    onChange={(e) => setMpPaymentId(e.target.value)}
                    placeholder="Ex: 12345678901"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={reconcileLoading}
                    onClick={handleReconcilePayment}
                    className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/25 disabled:opacity-50"
                  >
                    {reconcileLoading ? 'Sincronizando…' : 'Sincronizar pagamento'}
                  </button>
                </div>
              </div>
            </div>

            <MockupUploadField
              file={mockupFile}
              onChange={setMockupFile}
              orderType={selected.order_type}
            />

            <div>
              <p className="text-gray-500 text-sm mb-2">Linha do tempo</p>
              <OrderTimeline order={selected} currentStatus={status} />
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

            {selected.custom_order_files?.length > 0 && (() => {
              const artFiles = selected.custom_order_files.filter(
                (f) => (f.kind === 'customer_art' || f.kind === 'reference') && f.storage_url,
              );
              const mockupFile = selected.custom_order_files.find((f) => f.kind === 'mockup' && f.storage_url);
              const sourceFiles = artFiles.length
                ? artFiles
                : selected.custom_order_files.filter((f) => f.kind === 'customer_art' || f.kind === 'reference');
              const sourceLabel = artFiles.some((f) => f.kind === 'customer_art')
                ? 'Arte do cliente'
                : artFiles.some((f) => f.kind === 'reference')
                  ? 'Referência'
                  : 'Arte / referência';

              const renderFileCard = (f, label) => {
                const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(f.file_name || f.storage_url || '');
                return (
                  <div key={f.id} className="rounded-xl border border-white/10 bg-white/5 p-3 h-full flex flex-col">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">{label}</p>
                    {isImage && f.storage_url ? (
                      <a href={f.storage_url} target="_blank" rel="noreferrer" className="block flex-1 mb-2">
                        <img
                          src={f.storage_url}
                          alt={f.file_name || label}
                          className="w-full max-h-[360px] object-contain rounded bg-black/40"
                        />
                      </a>
                    ) : null}
                    <a href={f.storage_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all mt-auto">
                      {f.file_name || 'Abrir arquivo'}
                    </a>
                  </div>
                );
              };

              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Arte e mockup</p>
                    <p className="text-xs text-gray-500 mb-3">Compare a arte enviada com o mockup na peça.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {sourceFiles.length > 0 ? (
                          sourceFiles.map((f, index) =>
                            renderFileCard(
                              f,
                              sourceFiles.length > 1 ? `${sourceLabel} ${index + 1}` : sourceLabel,
                            ),
                          )
                        ) : (
                          <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-gray-500 min-h-[180px] flex items-center justify-center">
                            Sem arte ou referência anexada
                          </div>
                        )}
                      </div>
                      <div>
                        {mockupFile ? (
                          renderFileCard(mockupFile, 'Mockup no produto')
                        ) : (
                          <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-gray-500 min-h-[180px] flex items-center justify-center">
                            Mockup ainda não enviado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm mb-2">Todos os arquivos</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {selected.custom_order_files.map((f) => {
                        const kindLabel =
                          f.kind === 'customer_art'
                            ? 'Arte do cliente'
                            : f.kind === 'reference'
                              ? 'Referência'
                              : f.kind === 'mockup'
                                ? 'Mockup'
                                : f.kind;
                        return renderFileCard(f, kindLabel);
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

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
                Enviar mockup avança para &quot;Mockup pronto&quot; (arte exclusiva) ou &quot;Aguardando peça&quot; (arte pronta).
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-white">Frete — referência (cliente escolhe no pagamento)</p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">CEP de entrega</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={shippingCep}
                    onChange={(e) => setShippingCep(formatCepInput(e.target.value))}
                    placeholder="00000-000"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                  />
                  <button
                    type="button"
                    disabled={quoteLoading}
                    onClick={handleQuoteShipping}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm hover:bg-primary/25 disabled:opacity-50"
                  >
                    {quoteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                    Cotar frete
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Estimativa com peso/dimensões do insumo ({formatInsumoLabel(selected)} · qtd {selected.quantity}).
                  O cliente escolhe transportadora ou retirada no RJ ao pagar a peça.
                </p>
              </div>

              {shippingQuoteOptions.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {shippingQuoteOptions.map((option) => {
                    const optionId = String(option.id);
                    return (
                      <div
                        key={optionId}
                        className="w-full text-left rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-300"
                      >
                        <span className="font-medium">{option.label || `${option.company} / ${option.name}`}</span>
                        <span className="float-right text-primary">{formatMoney(option.price)}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Prazo: {formatShippingDeadline(option)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {selected.shipping_method ? (
                <p className="text-xs text-emerald-400">
                  Frete escolhido pelo cliente: {selected.shipping_method} ({formatMoney(selected.shipping_amount || 0)})
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Nenhum frete definido ainda — será escolhido pelo cliente no pagamento da peça.
                </p>
              )}
            </div>

            {selected.order_type === 'exclusive_art' && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-400">Revisões via WhatsApp</p>
                    <p className="text-lg font-medium">
                      {Number(selected.revision_count || 0)} / {Number(selected.max_revisions || 3)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={buildAdminWhatsAppUrl(selected)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm hover:bg-emerald-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      disabled={revisionLoading || Number(selected.revision_count || 0) >= Number(selected.max_revisions || 3)}
                      onClick={handleIncrementRevision}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 bg-white/5 text-sm hover:border-primary/40 disabled:opacity-40"
                    >
                      {revisionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Registrar revisão
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-500 mb-1">Notas internas</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 resize-y"
              />
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

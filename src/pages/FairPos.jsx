import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Banknote,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { productsService } from '../services/products';
import { stockService } from '../services/stock';
import { posService } from '../services/pos';
import { normalizeImageUrl } from '../utils/imageUtils';
import {
  findBlankForSize,
  findBlankStockItems,
  formatMoney,
  getColorMeta,
  parseProductColors,
  productImageUrl,
  resolveUnitPrice,
} from '../utils/fairPos';

const PAYMENT_OPTIONS = [
  { id: 'pix', label: 'Pix', icon: QrCode },
  { id: 'cash', label: 'Dinheiro', icon: Banknote },
  { id: 'card', label: 'Cartão', icon: CreditCard },
];

const SIZE_ORDER = ['P', 'M', 'G', 'GG', 'XGG', 'Tamanho Único'];

function sortSizes(sizes) {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(String(a).toUpperCase());
    const ib = SIZE_ORDER.indexOf(String(b).toUpperCase());
    if (ia === -1 && ib === -1) return String(a).localeCompare(String(b));
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export default function FairPos() {
  const [products, setProducts] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [fairName, setFairName] = useState(() => localStorage.getItem('rg_fair_name') || '');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [customerName, setCustomerName] = useState('');
  const [lastSale, setLastSale] = useState(null);
  const [sessionSales, setSessionSales] = useState([]);

  const loadData = async (showToast = false) => {
    try {
      setLoading(true);
      const [productRows, stockRows] = await Promise.all([
        productsService.getProducts(),
        stockService.getStock(),
      ]);
      const activeProducts = (productRows || []).filter((p) => {
        if (p.active === false || p.active === 'false') return false;
        if (p.is_active === false) return false;
        return true;
      });
      setProducts(activeProducts);
      setStockItems(stockRows || []);
      if (showToast) toast.success('Estoque atualizado');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar estampas/estoque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('rg_fair_name', fairName || '');
  }, [fairName]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => String(p.name || '').toLowerCase().includes(term));
  }, [products, search]);

  const colors = useMemo(
    () => (selectedProduct ? parseProductColors(selectedProduct) : []),
    [selectedProduct],
  );

  const blanksForColor = useMemo(() => {
    if (!selectedProduct || !selectedColor) return [];
    return findBlankStockItems(selectedProduct, stockItems, selectedColor);
  }, [selectedProduct, selectedColor, stockItems]);

  const sizeOptions = useMemo(() => {
    const sizes = blanksForColor.map((row) => String(row.size || '').trim()).filter(Boolean);
    return sortSizes([...new Set(sizes)]);
  }, [blanksForColor]);

  const selectedBlank = useMemo(() => {
    if (!selectedProduct || !selectedColor || !selectedSize) return null;
    return findBlankForSize(selectedProduct, stockItems, selectedColor, selectedSize);
  }, [selectedProduct, selectedColor, selectedSize, stockItems]);

  const unitPrice = useMemo(
    () => resolveUnitPrice(selectedProduct, selectedSize),
    [selectedProduct, selectedSize],
  );

  const maxQty = Math.max(0, Number(selectedBlank?.quantity || 0));
  const lineTotal = unitPrice * quantity;
  const canSell = Boolean(selectedProduct && selectedColor && selectedSize && selectedBlank && maxQty > 0 && quantity >= 1 && quantity <= maxQty && !submitting);

  const resetSelection = () => {
    setSelectedProduct(null);
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
    setCustomerName('');
    setLastSale(null);
  };

  const openProduct = (product) => {
    setLastSale(null);
    setSelectedProduct(product);
    const productColors = parseProductColors(product);
    setSelectedColor(productColors[0] || null);
    setSelectedSize(null);
    setQuantity(1);
  };

  useEffect(() => {
    if (!selectedColor || !selectedProduct) return;
    const blanks = findBlankStockItems(selectedProduct, stockItems, selectedColor);
    const available = blanks.find((row) => Number(row.quantity) > 0);
    if (available) {
      setSelectedSize(String(available.size));
      setQuantity(1);
    } else if (blanks[0]) {
      setSelectedSize(String(blanks[0].size));
      setQuantity(1);
    } else {
      setSelectedSize(null);
    }
  }, [selectedColor, selectedProduct, stockItems]);

  const handleSell = async () => {
    if (!canSell || !selectedBlank) return;
    try {
      setSubmitting(true);
      const colorMeta = getColorMeta(selectedColor);
      const result = await posService.createSale({
        paymentMethod,
        fairName: fairName || undefined,
        customerName: customerName || undefined,
        items: [
          {
            name: selectedProduct.name,
            slug: selectedProduct.slug,
            productId: selectedProduct.id,
            imageUrl: productImageUrl(selectedProduct),
            color: colorMeta.label || selectedColor,
            colorKey: colorMeta.key,
            size: selectedSize,
            quantity,
            unitPrice,
            sku: selectedBlank.sku,
            stockItemId: selectedBlank.id,
          },
        ],
      });

      const line = result.lines?.[0];
      setLastSale({
        ...result,
        summary: line
          ? `${line.estampa} · ${line.color} · ${line.size}`
          : selectedProduct.name,
        blankLabel: line?.blankLabel || selectedBlank.sku,
        remainingAfter: line?.remainingAfter,
      });
      setSessionSales((prev) => [
        {
          id: result.orderNumber,
          when: new Date().toISOString(),
          estampa: selectedProduct.name,
          detail: `${selectedColor} · ${selectedSize} · x${quantity}`,
          blank: line?.blankSku || selectedBlank.sku,
          total: lineTotal,
          payment: result.paymentLabel || paymentMethod,
        },
        ...prev,
      ].slice(0, 20));

      toast.success('Venda registrada · estoque baixado');
      await loadData(false);
      setSelectedProduct(null);
      setSelectedColor(null);
      setSelectedSize(null);
      setQuantity(1);
      setCustomerName('');
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || error.message || 'Falha ao registrar venda.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !products.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 pb-28">
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-heading text-2xl tracking-wide text-white">Venda Feira</p>
            <p className="text-xs text-[var(--color-text-muted)]">Estampa → blank → baixa estoque</p>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="rounded-2xl border border-[var(--color-border)] p-3 text-[var(--color-text-muted)] hover:text-white"
            aria-label="Atualizar estoque"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <label className="block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          Nome da feira (opcional)
          <input
            value={fairName}
            onChange={(e) => setFairName(e.target.value)}
            placeholder="Ex: Feira da Glória"
            className="mt-1 w-full rounded-2xl border border-[var(--color-border)] bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-[var(--color-primary)]"
          />
        </label>
      </div>

      {lastSale && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="mb-1 flex items-center gap-2 text-emerald-400">
            <Check size={18} />
            <span className="font-heading text-xl tracking-wide">Venda ok</span>
          </div>
          <p className="text-sm text-white">{lastSale.summary}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Blank: {lastSale.blankLabel}
            {typeof lastSale.remainingAfter === 'number' ? ` · restam ${lastSale.remainingAfter}` : ''}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Pedido {lastSale.orderNumber}</p>
        </div>
      )}

      {!selectedProduct ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar estampa"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3.5 pl-11 pr-4 text-base text-white outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const img = productImageUrl(product);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => openProduct(product)}
                  className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] text-left transition active:scale-[0.98]"
                >
                  <div className="aspect-square bg-black/40">
                    {img ? (
                      <img
                        src={normalizeImageUrl(img)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
                        <ShoppingBag size={28} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-white">{product.name}</p>
                    <p className="mt-1 text-xs text-[var(--color-primary)]">{formatMoney(product.price)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {!filteredProducts.length && (
            <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">Nenhuma estampa encontrada.</p>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={resetSelection}
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white"
          >
            <ArrowLeft size={16} /> Voltar às estampas
          </button>

          <div className="flex gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-black/40">
              {productImageUrl(selectedProduct) ? (
                <img
                  src={normalizeImageUrl(productImageUrl(selectedProduct))}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="font-heading text-2xl tracking-wide text-white">{selectedProduct.name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">Escolha cor e tamanho do blank</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Cor</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const meta = getColorMeta(color);
                const active = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`inline-flex min-h-12 items-center gap-2 rounded-2xl border px-4 py-2 text-sm ${
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-white'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-white/20"
                      style={{ backgroundColor: meta.hex }}
                    />
                    {meta.label || color}
                  </button>
                );
              })}
              {!colors.length && (
                <p className="text-sm text-[var(--color-text-muted)]">Produto sem cores cadastradas.</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Tamanho</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {sizeOptions.map((size) => {
                const blank = blanksForColor.find((row) => String(row.size).toUpperCase() === String(size).toUpperCase());
                const qty = Number(blank?.quantity || 0);
                const active = selectedSize === size;
                const disabled = qty <= 0;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSelectedSize(size);
                      setQuantity(1);
                    }}
                    className={`min-h-[4.5rem] rounded-2xl border px-2 py-3 text-center ${
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-white'
                        : disabled
                          ? 'border-[var(--color-border)] text-zinc-600 opacity-50'
                          : 'border-[var(--color-border)] text-white'
                    }`}
                  >
                    <div className="font-heading text-2xl tracking-wide">{size}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">
                      {disabled ? 'Esgotado' : `${qty} un`}
                    </div>
                  </button>
                );
              })}
            </div>
            {!sizeOptions.length && selectedColor && (
              <p className="mt-2 text-sm text-amber-400">Sem blank correspondente a esta estampa/cor no estoque.</p>
            )}
          </div>

          {selectedBlank && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-black/30 px-4 py-3 text-sm">
              <p className="text-white">
                Blank: {selectedBlank.category} {selectedBlank.model} · {selectedBlank.color_label} · {selectedBlank.size}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">SKU {selectedBlank.sku} · disponível {maxQty}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              Qtd
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  className="h-12 w-12 rounded-2xl border border-[var(--color-border)] text-xl"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, maxQty)}
                  value={quantity}
                  onChange={(e) => {
                    const next = Number(e.target.value) || 1;
                    setQuantity(Math.min(Math.max(1, next), Math.max(1, maxQty)));
                  }}
                  className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-black/40 text-center text-lg text-white outline-none"
                />
                <button
                  type="button"
                  className="h-12 w-12 rounded-2xl border border-[var(--color-border)] text-xl"
                  disabled={quantity >= maxQty}
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                >
                  +
                </button>
              </div>
            </label>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Total</p>
              <p className="mt-3 font-heading text-3xl tracking-wide text-[var(--color-primary)]">
                {formatMoney(lineTotal)}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Pagamento</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map(({ id, label, icon: Icon }) => {
                const active = paymentMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border text-sm ${
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-white'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            Cliente (opcional)
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome do cliente"
              className="mt-1 w-full rounded-2xl border border-[var(--color-border)] bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-[var(--color-primary)]"
            />
          </label>

          <button
            type="button"
            disabled={!canSell}
            onClick={handleSell}
            className="btn-primary fixed bottom-4 left-4 right-4 z-40 mx-auto h-14 max-w-xl shadow-lg disabled:cursor-not-allowed disabled:opacity-40 lg:static lg:mt-2"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} /> Salvando…
              </span>
            ) : (
              `Vender · ${formatMoney(lineTotal)}`
            )}
          </button>
        </div>
      )}

      {sessionSales.length > 0 && !selectedProduct && (
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="mb-3 font-heading text-xl tracking-wide text-white">Nesta sessão</p>
          <ul className="space-y-3">
            {sessionSales.map((sale) => (
              <li key={`${sale.id}-${sale.when}`} className="border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{sale.estampa}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {sale.detail} · blank {sale.blank} · {sale.payment}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--color-primary)]">{formatMoney(sale.total)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

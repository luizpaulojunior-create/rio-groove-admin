import { useEffect, useState } from 'react';
import { Check, Copy, Link2, Loader2, MessageCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { manualChargesService } from '../services/manualCharges';

const emptyForm = {
  amount: '',
  description: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
};

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}

function paymentMessage(charge) {
  const firstName = String(charge.customerName || '').trim().split(' ')[0];
  const hello = firstName ? `Olá ${firstName}!` : 'Olá!';
  return `${hello} Segue o pagamento da Rio Groove:\n\n${charge.description}\n${formatMoney(charge.amount)}\n\nPague por este link (Pix, cartão, boleto ou saldo Mercado Pago):\n${charge.payUrl}`;
}

function whatsAppHref(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return '';
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

async function copyText(value) {
  await navigator.clipboard.writeText(value);
}

export default function ManualCharges() {
  const [form, setForm] = useState(emptyForm);
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const rows = await manualChargesService.list();
      setCharges(rows);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Não foi possível carregar as cobranças.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const markCopied = (key) => {
    setCopied(key);
    window.setTimeout(() => setCopied(''), 1800);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const charge = await manualChargesService.create(form);
      setCreated(charge);
      setForm(emptyForm);
      setCharges((current) => [charge, ...current.filter((item) => item.id !== charge.id)]);
      toast.success('Link pronto para enviar no WhatsApp.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Não foi possível criar a cobrança.');
    } finally {
      setSaving(false);
    }
  };

  const createdWhatsApp = created ? whatsAppHref(created.customerPhone, paymentMessage(created)) : '';

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-heading text-4xl tracking-widest text-white">COBRANÇA</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Escolha o valor e envie o link no WhatsApp da loja. O cliente paga com Pix, cartão, boleto ou saldo Mercado Pago.
        </p>
      </div>

      <form onSubmit={handleCreate} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 md:p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            Valor
            <input
              required
              inputMode="decimal"
              placeholder="150,00"
              value={form.amount}
              onChange={setField('amount')}
              className="mt-1 h-12 w-full rounded-2xl border border-[var(--color-border)] bg-black/30 px-4 text-base text-white"
            />
          </label>
          <label className="block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            WhatsApp do cliente
            <input
              inputMode="tel"
              placeholder="21999999999"
              value={form.customerPhone}
              onChange={setField('customerPhone')}
              className="mt-1 h-12 w-full rounded-2xl border border-[var(--color-border)] bg-black/30 px-4 text-base text-white"
            />
          </label>
        </div>

        <label className="block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          O que está sendo cobrado
          <input
            required
            maxLength={140}
            placeholder="Sinal da camisa personalizada"
            value={form.description}
            onChange={setField('description')}
            className="mt-1 h-12 w-full rounded-2xl border border-[var(--color-border)] bg-black/30 px-4 text-base text-white"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            Nome do cliente
            <input
              required
              value={form.customerName}
              onChange={setField('customerName')}
              className="mt-1 h-12 w-full rounded-2xl border border-[var(--color-border)] bg-black/30 px-4 text-base text-white"
            />
          </label>
          <label className="block text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            E-mail do cliente
            <input
              required
              type="email"
              value={form.customerEmail}
              onChange={setField('customerEmail')}
              className="mt-1 h-12 w-full rounded-2xl border border-[var(--color-border)] bg-black/30 px-4 text-base text-white"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-6 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Link2 size={18} />}
          Gerar link de pagamento
        </button>
      </form>

      {created && (
        <section className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 md:p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-300">Link pronto</p>
            <p className="mt-1 text-2xl text-white">{formatMoney(created.amount)}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{created.description} · {created.customerName}</p>
          </div>
          <p className="break-all rounded-2xl bg-black/40 px-4 py-3 text-sm text-white">{created.payUrl}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => copyText(created.payUrl).then(() => markCopied('link')).catch(() => toast.error('Não foi possível copiar.'))}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 px-4 text-sm text-white"
            >
              {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
              Copiar link
            </button>
            <button
              type="button"
              onClick={() => copyText(paymentMessage(created)).then(() => markCopied('msg')).catch(() => toast.error('Não foi possível copiar.'))}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 px-4 text-sm text-white"
            >
              {copied === 'msg' ? <Check size={16} /> : <Copy size={16} />}
              Copiar mensagem
            </button>
            {createdWhatsApp ? (
              <a
                href={createdWhatsApp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#22C55E] px-4 text-sm font-medium text-white"
              >
                <MessageCircle size={16} />
                Enviar no WhatsApp
              </a>
            ) : (
              <p className="self-center text-sm text-[var(--color-text-muted)]">
                Sem WhatsApp do cliente: copie a mensagem e cole no chat.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-white">Cobranças recentes</h2>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
        {loading && !charges.length ? (
          <p className="text-sm text-[var(--color-text-muted)]">Carregando…</p>
        ) : null}
        {!loading && !charges.length ? (
          <p className="text-sm text-[var(--color-text-muted)]">Nenhuma cobrança criada ainda.</p>
        ) : null}
        <div className="space-y-2">
          {charges.map((charge) => {
            const href = whatsAppHref(charge.customerPhone, paymentMessage(charge));
            return (
              <article key={charge.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 md:flex md:items-center md:justify-between md:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-white">{formatMoney(charge.amount)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${charge.paid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-200'}`}>
                      {charge.paid ? 'Pago' : 'Aguardando'}
                    </span>
                  </div>
                  <p className="truncate text-sm text-[var(--color-text-muted)]">
                    {charge.description} · {charge.customerName}
                  </p>
                </div>
                <div className="mt-3 flex gap-2 md:mt-0">
                  <button
                    type="button"
                    onClick={() => copyText(charge.payUrl).then(() => toast.success('Link copiado.')).catch(() => toast.error('Não foi possível copiar.'))}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-white"
                  >
                    <Copy size={14} />
                    Link
                  </button>
                  {href && !charge.paid ? (
                    <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#22C55E] px-3 text-sm text-white">
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

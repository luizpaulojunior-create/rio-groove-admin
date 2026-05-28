import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, Percent } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentual (%)' },
  { value: 'fixed', label: 'Valor fixo (R$)' },
  { value: 'free_shipping', label: 'Frete grátis' },
];

const emptyForm = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_purchase_amount: '',
  max_discount_amount: '',
  starts_at: '',
  expires_at: '',
  usage_limit: '',
  is_active: true,
};

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') {
          toast.error('Tabela coupons não encontrada. Execute supabase/10_p1_cms_coupons_landing.sql');
          setCoupons([]);
        } else {
          throw error;
        }
      } else {
        setCoupons(data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value ?? '',
      min_purchase_amount: coupon.min_purchase_amount ?? '',
      max_discount_amount: coupon.max_discount_amount ?? '',
      starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
      usage_limit: coupon.usage_limit ?? '',
      is_active: coupon.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const buildPayload = () => {
    const parseNum = (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return Number.isFinite(num) ? num : null;
    };

    return {
      code: String(form.code || '').trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseNum(form.discount_value) ?? 0,
      min_purchase_amount: parseNum(form.min_purchase_amount),
      max_discount_amount: parseNum(form.max_discount_amount),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      usage_limit: parseNum(form.usage_limit),
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    const payload = buildPayload();
    if (!payload.code) {
      toast.error('Código do cupom é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      const toastId = toast.loading('Salvando cupom...');

      if (editing) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert([{ ...payload, usage_count: 0 }]);
        if (error) throw error;
      }

      toast.update(toastId, { render: 'Cupom salvo!', type: 'success', isLoading: false, autoClose: 2500 });
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erro ao salvar cupom');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Excluir cupom ${coupon.code}?`)) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', coupon.id);
      if (error) throw error;
      toast.success('Cupom excluído');
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir cupom');
    }
  };

  const formatDiscount = (coupon) => {
    if (coupon.discount_type === 'free_shipping') return 'Frete grátis';
    if (coupon.discount_type === 'fixed') return `R$ ${Number(coupon.discount_value).toFixed(2)}`;
    return `${Number(coupon.discount_value)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-heading text-4xl flex items-center gap-3 text-white">
          <Ticket className="text-[#FF4D00]" size={32} />
          Cupons
        </h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D00] text-white">
          <Plus size={18} /> Novo Cupom
        </button>
      </div>

      <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="p-4">Código</th>
              <th className="p-4">Desconto</th>
              <th className="p-4">Uso</th>
              <th className="p-4">Validade</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="p-4 font-mono font-bold text-white">{coupon.code}</td>
                <td className="p-4 text-white/80">{formatDiscount(coupon)}</td>
                <td className="p-4 text-white/60">
                  {coupon.usage_count || 0}
                  {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                </td>
                <td className="p-4 text-sm text-white/60">
                  {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('pt-BR') : 'Sem expiração'}
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${coupon.is_active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'}`}>
                    {coupon.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => openEdit(coupon)} className="p-2 text-white/50 hover:text-white"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(coupon)} className="p-2 text-red-500/50 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-white/40">Nenhum cupom cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar Cupom' : 'Novo Cupom'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Código</label>
            <input name="code" value={form.code} onChange={handleChange} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white uppercase" placeholder="GROOVE10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Tipo</label>
              <select name="discount_type" value={form.discount_type} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white">
                {DISCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Valor</label>
              <input name="discount_value" type="number" step="0.01" min="0" value={form.discount_value} onChange={handleChange} disabled={form.discount_type === 'free_shipping'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Compra mínima (R$)</label>
              <input name="min_purchase_amount" type="number" step="0.01" min="0" value={form.min_purchase_amount} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Desconto máximo (R$)</label>
              <input name="max_discount_amount" type="number" step="0.01" min="0" value={form.max_discount_amount} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Início</label>
              <input name="starts_at" type="datetime-local" value={form.starts_at} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Expira</label>
              <input name="expires_at" type="datetime-local" value={form.expires_at} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Limite de uso</label>
            <input name="usage_limit" type="number" min="1" value={form.usage_limit} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" placeholder="Ilimitado se vazio" />
          </div>
          <label className="flex items-center gap-3 text-white/80">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="rounded" />
            Cupom ativo
          </label>
          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-[#FF4D00] text-white font-medium flex items-center justify-center gap-2">
            <Percent size={18} /> {saving ? 'Salvando...' : 'Salvar Cupom'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

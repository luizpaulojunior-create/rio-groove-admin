import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Link2, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import { fetchAffiliateStats, saveAffiliate, deleteAffiliate } from '../services/growthCms';

const STORE_URL = 'https://rio-groove-store-v2.pages.dev';

const emptyForm = {
  id: null,
  name: '',
  slug: '',
  email: '',
  commission_rate: 10,
  coupon_code: '',
  notes: '',
  active: true,
};

export default function Affiliates() {
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setTableMissing(false);
      const data = await fetchAffiliateStats();
      setAffiliates(data);
    } catch (err) {
      console.error(err);
      if (err.code === 'AFFILIATES_TABLE_MISSING') setTableMissing(true);
      else toast.error('Erro ao carregar afiliados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const affiliateLink = (slug) => `${STORE_URL}/?ref=${slug}`;

  const copyLink = (slug) => {
    navigator.clipboard.writeText(affiliateLink(slug));
    toast.success('Link copiado!');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      await saveAffiliate(formData, formData.id);
      toast.success(formData.id ? 'Afiliado atualizado!' : 'Afiliado criado!');
      setIsModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar afiliado.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este afiliado?')) return;
    try {
      await deleteAffiliate(id);
      toast.success('Afiliado excluído.');
      load();
    } catch (err) {
      toast.error('Erro ao excluir.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-heading tracking-widest text-white uppercase">Afiliados</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1 max-w-2xl">
            Parceiros divulgam com link <code className="text-[#FF4D00]">?ref=slug</code>. Vendas atribuídas aparecem nos pedidos.
            Comissão é calculada manualmente com base no % cadastrado.
          </p>
        </div>
        {!tableMissing && (
          <button type="button" onClick={() => { setFormData(emptyForm); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Novo afiliado
          </button>
        )}
      </div>

      {tableMissing && (
        <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/30 rounded-3xl p-6 text-white">
          Execute <strong>supabase/12_growth_tools.sql</strong> no Supabase.
        </div>
      )}

      {!tableMissing && (
        <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 text-xs uppercase text-white/50">Nome</th>
                <th className="p-4 text-xs uppercase text-white/50">Slug / Link</th>
                <th className="p-4 text-xs uppercase text-white/50">Comissão</th>
                <th className="p-4 text-xs uppercase text-white/50">Cliques</th>
                <th className="p-4 text-xs uppercase text-white/50">Pedidos</th>
                <th className="p-4 text-xs uppercase text-white/50">Receita paga</th>
                <th className="p-4 text-xs uppercase text-white/50 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {affiliates.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="font-medium text-white">{a.name}</div>
                    {a.coupon_code && <div className="text-xs text-white/40">Cupom: {a.coupon_code}</div>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link2 size={14} className="text-[#FF4D00]" />
                      <span className="text-sm text-white/70">{a.slug}</span>
                      <button type="button" onClick={() => copyLink(a.slug)} className="p-1 hover:text-white text-white/40" title="Copiar link"><Copy size={14} /></button>
                    </div>
                  </td>
                  <td className="p-4 text-white/70">{Number(a.commission_rate).toFixed(0)}%</td>
                  <td className="p-4 text-white/70">{a.clicks}</td>
                  <td className="p-4 text-white/70">{a.orders}</td>
                  <td className="p-4 text-white/70">R$ {Number(a.revenue).toFixed(2)}</td>
                  <td className="p-4 text-right space-x-2">
                    <button type="button" onClick={() => { setFormData({ id: a.id, name: a.name, slug: a.slug, email: a.email || '', commission_rate: a.commission_rate, coupon_code: a.coupon_code || '', notes: a.notes || '', active: a.active }); setIsModalOpen(true); }} className="p-2 text-white/50 hover:text-white"><Edit2 size={16} /></button>
                    <button type="button" onClick={() => handleDelete(a.id)} className="p-2 text-white/50 hover:text-red-400"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {affiliates.length === 0 && (
                <tr><td colSpan="7" className="p-8 text-center text-white/40">Nenhum afiliado. Crie o primeiro e compartilhe o link.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => !saving && setIsModalOpen(false)} title={formData.id ? 'Editar afiliado' : 'Novo afiliado'} maxWidth="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">Nome</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">Slug (ref na URL)</label>
            <input required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="ex: dj-marcelo" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">E-mail (opcional)</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-white/50 mb-1">Comissão (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
            </div>
            <div>
              <label className="block text-xs uppercase text-white/50 mb-1">Cupom (opcional)</label>
              <input value={formData.coupon_code} onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">Notas internas</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white resize-none" />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
            Afiliado ativo
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? 'Salvando...' : <><Save size={16} /> Salvar</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

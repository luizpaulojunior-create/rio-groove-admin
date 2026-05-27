import React, { useState, useEffect } from 'react';
import { Plus, Download, Trash2, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import {
  fetchNewsletterSubscribers,
  saveNewsletterSubscriber,
  deleteNewsletterSubscriber,
  backfillNewsletterFromOrders,
} from '../services/growthCms';

const emptyForm = { id: null, email: '', name: '', source: 'manual', status: 'active' };

export default function Newsletter() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      setTableMissing(false);
      const data = await fetchNewsletterSubscribers();
      setSubscribers(data);
    } catch (err) {
      console.error(err);
      if (err.code === 'NEWSLETTER_TABLE_MISSING') setTableMissing(true);
      else toast.error('Erro ao carregar inscritos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = subscribers.filter((s) => filter === 'all' || s.status === filter);

  const exportCsv = () => {
    const rows = [['email', 'nome', 'origem', 'status', 'inscrito_em']];
    filtered.forEach((s) => {
      rows.push([s.email, s.name || '', s.source, s.status, s.subscribed_at]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-rio-groove-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      await saveNewsletterSubscriber(formData, formData.id);
      toast.success(formData.id ? 'Inscrito atualizado!' : 'Inscrito adicionado!');
      setIsModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar inscrito.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este inscrito?')) return;
    try {
      await deleteNewsletterSubscriber(id);
      toast.success('Inscrito removido.');
      load();
    } catch (err) {
      toast.error('Erro ao remover.');
    }
  };

  const handleBackfill = async () => {
    try {
      const count = await backfillNewsletterFromOrders();
      toast.success(`${count} e-mails importados de pedidos com opt-in.`);
      load();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao importar de pedidos.');
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
          <h1 className="text-3xl font-heading tracking-widest text-white uppercase">Newsletter</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Lista de e-mails — footer da loja, checkout e cadastro manual. Exporte para Mailchimp, Brevo, etc.
          </p>
        </div>
        {!tableMissing && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleBackfill} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={16} /> Importar de pedidos
            </button>
            <button type="button" onClick={exportCsv} className="btn-secondary flex items-center gap-2">
              <Download size={16} /> Exportar CSV
            </button>
            <button type="button" onClick={() => { setFormData(emptyForm); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Adicionar
            </button>
          </div>
        )}
      </div>

      {tableMissing && (
        <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/30 rounded-3xl p-6 text-white">
          Execute <strong>supabase/12_growth_tools.sql</strong> no Supabase.
        </div>
      )}

      {!tableMissing && (
        <>
          <div className="flex gap-2">
            {['all', 'active', 'unsubscribed'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm ${filter === f ? 'bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30' : 'bg-white/5 text-white/60'}`}
              >
                {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Cancelados'}
              </button>
            ))}
            <span className="ml-auto text-sm text-white/40 self-center">{filtered.length} inscritos</span>
          </div>

          <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-4 text-xs uppercase text-white/50">E-mail</th>
                  <th className="p-4 text-xs uppercase text-white/50">Nome</th>
                  <th className="p-4 text-xs uppercase text-white/50">Origem</th>
                  <th className="p-4 text-xs uppercase text-white/50">Status</th>
                  <th className="p-4 text-xs uppercase text-white/50 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 text-white flex items-center gap-2"><Mail size={14} className="text-white/30" />{s.email}</td>
                    <td className="p-4 text-white/70">{s.name || '—'}</td>
                    <td className="p-4 text-white/50 text-sm">{s.source}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${s.status === 'active' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-gray-400 border-gray-500/20'}`}>
                        {s.status === 'active' ? 'Ativo' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button type="button" onClick={() => { setFormData({ id: s.id, email: s.email, name: s.name || '', source: s.source, status: s.status }); setIsModalOpen(true); }} className="text-xs text-white/50 hover:text-white">Editar</button>
                      <button type="button" onClick={() => handleDelete(s.id)} className="p-2 text-white/50 hover:text-red-400"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-white/40">Nenhum inscrito ainda. Ative o formulário no footer da loja.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => !saving && setIsModalOpen(false)} title={formData.id ? 'Editar inscrito' : 'Novo inscrito'} maxWidth="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">E-mail</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">Nome (opcional)</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white">
              <option value="active">Ativo</option>
              <option value="unsubscribed">Cancelado</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

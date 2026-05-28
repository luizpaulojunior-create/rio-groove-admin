import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, Layout, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  STOREFRONT_SECTION_KEYS,
  fetchStorefrontSection,
  saveStorefrontSection,
} from '../services/storefrontCms';

const DEFAULT_FOOTER = {
  newsletter_title: 'Newsletter',
  newsletter_placeholder: 'Seu e-mail',
  show_newsletter: true,
  copyright_suffix: 'Todos os direitos reservados.',
  support_blurb:
    'Suporte para dúvidas sobre pedido, pagamento, entrega e disponibilidade das coleções.',
};

export default function StorefrontFooter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionId, setSectionId] = useState(null);
  const [footerData, setFooterData] = useState(DEFAULT_FOOTER);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchStorefrontSection(STOREFRONT_SECTION_KEYS.FOOTER);
      if (data?.content) {
        setSectionId(data.id);
        setFooterData({ ...DEFAULT_FOOTER, ...data.content });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar configurações do footer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (key, value) => {
    setFooterData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const saved = await saveStorefrontSection({
        sectionKey: STOREFRONT_SECTION_KEYS.FOOTER,
        type: 'footer_config',
        content: footerData,
        id: sectionId,
        orderIndex: 90,
      });
      if (!sectionId) setSectionId(saved.id);
      toast.success('Footer salvo com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar footer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-12 text-center text-white/40">
        Carregando footer...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading text-white uppercase tracking-wider flex items-center gap-2">
            <Layout size={22} className="text-[#FF4D00]" />
            Footer da loja
          </h2>
          <p className="text-[var(--color-text-muted)] mt-1">
            Textos do rodapé e formulário de newsletter exibidos na storefront v2.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Recarregar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-2xl bg-[#FF4D00] text-white hover:bg-[#e64500] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <Mail size={18} className="text-[#FF4D00]" />
          <h3 className="text-lg font-heading text-white uppercase tracking-wide">Newsletter</h3>
        </div>

        <label className="flex items-center gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            checked={footerData.show_newsletter}
            onChange={(e) => handleChange('show_newsletter', e.target.checked)}
            className="rounded border-white/20 bg-black text-[#FF4D00] focus:ring-[#FF4D00]"
          />
          Exibir formulário de newsletter no footer
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Título</label>
            <input
              value={footerData.newsletter_title}
              onChange={(e) => handleChange('newsletter_title', e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Placeholder</label>
            <input
              value={footerData.newsletter_placeholder}
              onChange={(e) => handleChange('newsletter_placeholder', e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Texto de suporte (coluna direita)</label>
          <textarea
            rows={3}
            value={footerData.support_blurb}
            onChange={(e) => handleChange('support_blurb', e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-3 text-white resize-y"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">Sufixo do copyright</label>
          <input
            value={footerData.copyright_suffix}
            onChange={(e) => handleChange('copyright_suffix', e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white"
          />
        </div>
      </div>
    </div>
  );
}

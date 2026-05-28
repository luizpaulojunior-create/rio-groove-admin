import { useState, useEffect } from 'react';
import { Save, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  STOREFRONT_SECTION_KEYS,
  fetchStorefrontSection,
  saveStorefrontSection,
} from '../services/storefrontCms';
import { fetchSeoSettings, saveSeoSettings } from '../services/growthCms';
import { shippingService } from '../services/shipping';
import { useAuth } from '../contexts/AuthContext';
import { hasMinRole, ADMIN_ROLES } from '../config/adminRoles';

export default function Settings() {
  const { adminRole } = useAuth();
  const [connectingMe, setConnectingMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandingId, setBrandingId] = useState(null);
  const [seoId, setSeoId] = useState(null);
  const [form, setForm] = useState({
    store_name: '',
    contact_email: '',
    meta_description: '',
  });

  useEffect(() => {
    load();
  }, []);

  const handleConnectMelhorEnvio = async () => {
    if (!hasMinRole(adminRole, ADMIN_ROLES.SUPERADMIN)) {
      toast.error('Apenas superadmin pode reconectar o Melhor Envio.');
      return;
    }
    try {
      setConnectingMe(true);
      const { url } = await shippingService.startMelhorEnvioOAuth();
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.info('Complete a autorização na janela do Melhor Envio.');
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Falha ao iniciar OAuth.');
    } finally {
      setConnectingMe(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const [branding, seo] = await Promise.all([
        fetchStorefrontSection(STOREFRONT_SECTION_KEYS.BRANDING),
        fetchSeoSettings(),
      ]);

      setBrandingId(branding?.id || null);
      setSeoId(seo?.id || null);
      setForm({
        store_name: branding?.content?.store_name || 'Rio Groove Store',
        contact_email: branding?.content?.contact_email || 'contato@riogroove.com.br',
        meta_description:
          seo?.content?.meta_description ||
          branding?.content?.editorial?.institutional_phrase ||
          '',
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);

      const branding = await fetchStorefrontSection(STOREFRONT_SECTION_KEYS.BRANDING);
      const brandingContent = branding?.content || {};

      await saveStorefrontSection({
        id: brandingId,
        sectionKey: STOREFRONT_SECTION_KEYS.BRANDING,
        type: 'branding',
        content: {
          ...brandingContent,
          store_name: form.store_name.trim(),
          contact_email: form.contact_email.trim(),
          editorial: {
            ...(brandingContent.editorial || {}),
            institutional_phrase: form.meta_description.trim(),
          },
        },
      });

      const seo = await fetchSeoSettings();
      const seoContent = seo?.content || {};
      await saveSeoSettings({
        id: seoId,
        content: {
          ...seoContent,
          meta_description: form.meta_description.trim(),
        },
      });

      toast.success('Configurações salvas!');
      load();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
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
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-center">
        <h1 className="font-heading text-4xl">Configurações</h1>
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          <Save size={20} className="mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="card-premium space-y-10">
        <section className="space-y-6">
          <h3 className="text-2xl font-heading tracking-wide border-b border-[var(--color-border)] pb-3 text-white">
            Informações da Loja
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">
                Nome da Loja
              </label>
              <input
                name="store_name"
                value={form.store_name}
                onChange={handleChange}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">
                Email de Contato
              </label>
              <input
                name="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleChange}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">
                Descrição SEO Global
              </label>
              <textarea
                name="meta_description"
                value={form.meta_description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 resize-none"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Também disponível em{' '}
                <Link to="/admin/seo" className="text-[#FF4D00] hover:underline">
                  Marketing → SEO
                </Link>{' '}
                (título, imagem de compartilhamento, palavras-chave).
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-2xl font-heading tracking-wide border-b border-[var(--color-border)] pb-3 text-white">
            Integrações & API
          </h3>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-[var(--color-text-muted)] leading-relaxed">
            <p className="text-white font-medium mb-2">Melhor Envio</p>
            <p className="mb-4">
              Client ID e Client Secret são configurados no backend (Render), por segurança — não ficam editáveis
              aqui. Se precisar trocar, atualize as variáveis de ambiente no painel do Render.
            </p>
            {hasMinRole(adminRole, ADMIN_ROLES.SUPERADMIN) ? (
              <button
                type="button"
                onClick={handleConnectMelhorEnvio}
                disabled={connectingMe}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF4D00] text-white text-sm font-medium hover:bg-[#e64500] disabled:opacity-50 transition-colors"
              >
                <Link2 size={16} />
                {connectingMe ? 'Abrindo...' : 'Reconectar Melhor Envio'}
              </button>
            ) : (
              <p className="text-xs text-white/40">Somente superadmin pode reconectar a integração.</p>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}

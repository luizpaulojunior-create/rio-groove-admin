import React, { useState, useEffect } from 'react';
import { Save, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { storageService } from '../services/storage';
import { STORAGE_PATHS } from '../config/storage';
import { fetchSeoSettings, saveSeoSettings } from '../services/growthCms';

export default function Seo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ogFile, setOgFile] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    meta_title: '',
    meta_description: '',
    og_image_url: '',
    keywords: '',
    robots: 'index,follow',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchSeoSettings();
      if (data?.content) {
        setFormData({
          id: data.id,
          meta_title: data.content.meta_title || '',
          meta_description: data.content.meta_description || '',
          og_image_url: data.content.og_image_url || '',
          keywords: data.content.keywords || '',
          robots: data.content.robots || 'index,follow',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar SEO. Execute 12_growth_tools.sql se necessário.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      let ogUrl = formData.og_image_url;
      if (ogFile) {
        ogUrl = await storageService.uploadFile(ogFile, STORAGE_PATHS.BANNERS);
      }
      await saveSeoSettings({
        id: formData.id,
        content: {
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          og_image_url: ogUrl,
          keywords: formData.keywords,
          robots: formData.robots,
        },
      });
      toast.success('SEO global salvo!');
      load();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar SEO.');
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
    <div className="space-y-6 pb-20 max-w-3xl">
      <div>
        <h1 className="text-3xl font-heading tracking-widest text-white uppercase">SEO</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          Meta tags padrão da loja (Google, WhatsApp, Instagram). Produtos podem ter SEO próprio no cadastro.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-[#0D0D0D] border border-white/5 rounded-2xl p-6">
        <div>
          <label className="block text-xs uppercase text-white/50 mb-1">Título padrão (meta title)</label>
          <input value={formData.meta_title} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" placeholder="Rio Groove | Premium Streetwear" />
          <p className="text-xs text-white/40 mt-1">Aparece na aba do navegador e nos resultados do Google.</p>
        </div>

        <div>
          <label className="block text-xs uppercase text-white/50 mb-1">Descrição padrão (meta description)</label>
          <textarea value={formData.meta_description} onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white resize-none" />
          <p className="text-xs text-white/40 mt-1">Resumo exibido abaixo do título nas buscas (~160 caracteres).</p>
        </div>

        <div>
          <label className="block text-xs uppercase text-white/50 mb-1">Palavras-chave</label>
          <input value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white" placeholder="streetwear, rio, moda urbana" />
        </div>

        <div>
          <label className="block text-xs uppercase text-white/50 mb-1">Imagem de compartilhamento (Open Graph)</label>
          <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[1200/630] max-w-md bg-black/50">
            {formData.og_image_url ? (
              <img src={formData.og_image_url} alt="OG" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-white/20"><ImageIcon size={32} /></div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-[#FF4D00] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Upload size={16} /> Trocar
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setOgFile(f); setFormData({ ...formData, og_image_url: URL.createObjectURL(f) }); } }} />
              </label>
            </div>
          </div>
          <p className="text-xs text-white/40 mt-1">Preview ao compartilhar link no WhatsApp/redes.</p>
        </div>

        <div>
          <label className="block text-xs uppercase text-white/50 mb-1">Robots</label>
          <select value={formData.robots} onChange={(e) => setFormData({ ...formData, robots: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white">
            <option value="index,follow">index, follow (padrão — aparecer no Google)</option>
            <option value="noindex,nofollow">noindex, nofollow (ocultar da busca)</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? 'Salvando...' : <><Save size={16} /> Salvar SEO</>}
          </button>
        </div>
      </form>
    </div>
  );
}

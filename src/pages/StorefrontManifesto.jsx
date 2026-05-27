import React, { useState, useEffect } from 'react';
import { Save, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { storageService } from '../services/storage';
import { STORAGE_PATHS } from '../config/storage';
import {
  STOREFRONT_SECTION_KEYS,
  fetchStorefrontSection,
  saveStorefrontSection,
} from '../services/storefrontCms';

export default function StorefrontManifesto() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroFile, setHeroFile] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    title: 'Manifesto',
    subtitle: '',
    body: '',
    hero_image_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchStorefrontSection(STOREFRONT_SECTION_KEYS.MANIFESTO);
      if (data?.content) {
        setFormData({
          id: data.id,
          title: data.content.title || 'Manifesto',
          subtitle: data.content.subtitle || '',
          body: data.content.body || '',
          hero_image_url: data.content.hero_image_url || '',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar manifesto.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHeroUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroFile(file);
      setFormData((prev) => ({ ...prev, hero_image_url: URL.createObjectURL(file) }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      let heroUrl = formData.hero_image_url;
      if (heroFile) {
        heroUrl = await storageService.uploadFile(heroFile, STORAGE_PATHS.EDITORIAL);
      }

      await saveStorefrontSection({
        id: formData.id,
        sectionKey: STOREFRONT_SECTION_KEYS.MANIFESTO,
        type: 'manifesto',
        orderIndex: 7,
        content: {
          title: formData.title,
          subtitle: formData.subtitle,
          body: formData.body,
          hero_image_url: heroUrl,
        },
      });

      toast.success('Manifesto salvo!');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar manifesto.');
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
        <h2 className="text-2xl font-heading text-white uppercase tracking-wider">Manifesto</h2>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          Texto exibido em /movimentos/manifesto. Separe parágrafos com linha em branco.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-[#0D0D0D] border border-white/5 rounded-2xl p-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Título</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Subtítulo</label>
          <input type="text" name="subtitle" value={formData.subtitle} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Imagem hero (opcional)</label>
          <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[21/9] bg-black/50 max-w-xl">
            {formData.hero_image_url ? (
              <img src={formData.hero_image_url} alt="Hero manifesto" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-white/20">
                <ImageIcon size={32} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-[#FF4D00] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Upload size={16} /> Trocar
                <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Corpo do manifesto</label>
          <textarea name="body" value={formData.body} onChange={handleChange} rows={16} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] resize-y font-mono text-sm leading-relaxed" placeholder="Escreva o manifesto Rio Groove aqui..." />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            Salvar Manifesto
          </button>
        </div>
      </form>
    </div>
  );
}

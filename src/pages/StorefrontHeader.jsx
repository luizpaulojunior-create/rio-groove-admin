import React, { useState, useEffect } from 'react';
import { Upload, Save, RefreshCw, Layout, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { STORAGE_PATHS } from '../config/storage';
import { storageService } from '../services/storage';
import {
  STOREFRONT_SECTION_KEYS,
  fetchStorefrontSection,
  saveStorefrontSection,
} from '../services/storefrontCms';

export default function StorefrontHeader() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headerId, setHeaderId] = useState(null);
  const [headerData, setHeaderData] = useState({
    logo_url: '',
    sticky: true,
    transparent_on_top: true,
    height: '80',
    alignment: 'center'
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchStorefrontSection(STOREFRONT_SECTION_KEYS.HEADER);

      if (data) {
        setHeaderId(data.id);
        setHeaderData(data.content || {
          logo_url: '',
          sticky: true,
          transparent_on_top: true,
          height: '80',
          alignment: 'center',
        });
        setLastUpdated(data.updated_at);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar configurações do Header');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHeaderData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setSaving(true);
      const publicUrl = await storageService.uploadFile(file, STORAGE_PATHS.HEADER);
      setHeaderData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo carregada com sucesso! Clique em Salvar para aplicar.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const saved = await saveStorefrontSection({
        sectionKey: STOREFRONT_SECTION_KEYS.HEADER,
        type: 'header_config',
        content: { ...headerData },
        id: headerId,
      });

      // Sincroniza logo no branding.assets para fonte única operacional
      if (headerData.logo_url) {
        const brandingSection = await fetchStorefrontSection(STOREFRONT_SECTION_KEYS.BRANDING);
        if (brandingSection) {
          await saveStorefrontSection({
            sectionKey: STOREFRONT_SECTION_KEYS.BRANDING,
            type: brandingSection.type || 'branding',
            content: {
              ...brandingSection.content,
              assets: {
                ...(brandingSection.content?.assets || {}),
                logo_url: headerData.logo_url,
              },
            },
            id: brandingSection.id,
          });
        }
      }

      if (!headerId) {
        setHeaderId(saved.id);
      }

      toast.success('Configurações do Header salvas com sucesso');
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar configurações do Header');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white/5 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-[#0D0D0D] border border-white/5 p-4 rounded-2xl sticky top-4 z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-[#FF4D00]/10 p-2 rounded-xl text-[#FF4D00]">
            <Layout size={24} />
          </div>
          <div>
            <h2 className="text-xl font-heading text-white">Configurações do Header</h2>
            {lastUpdated && (
              <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                <RefreshCw size={10} /> Última sincronização: {new Date(lastUpdated).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Salvar Alterações</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identidade Visual */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-heading tracking-widest text-white uppercase">Identidade Visual</h3>
          </div>
          <div className="p-6">
            <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Logo do Header</label>
            <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/1] bg-black/50 max-w-sm mb-4">
              {headerData.logo_url ? (
                <div className="flex items-center justify-center h-full p-4">
                    <img src={headerData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/20">
                  <ImageIcon size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-[#FF4D00] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#e64500]">
                  <Upload size={16} /> Trocar Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={saving} />
                </label>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">Recomendado: SVG, PNG transparente. Altura máxima de 40px.</p>
          </div>
        </div>

        {/* Comportamento e Layout */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-heading tracking-widest text-white uppercase">Comportamento e Layout</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white block mb-1">Header Fixo (Sticky)</label>
                <p className="text-xs text-[var(--color-text-muted)]">O header acompanha o rolamento da página.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="sticky" checked={headerData.sticky} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white block mb-1">Transparente no Topo</label>
                <p className="text-xs text-[var(--color-text-muted)]">Fundo invisível antes do primeiro rolamento.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="transparent_on_top" checked={headerData.transparent_on_top} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00]"></div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Altura (px)</label>
                <input 
                  type="number" 
                  name="height"
                  value={headerData.height}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-colors"
                  placeholder="Ex: 80"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Alinhamento do Menu</label>
                <select
                  name="alignment"
                  value={headerData.alignment}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-colors appearance-none"
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

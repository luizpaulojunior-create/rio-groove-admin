import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Palette, Type, Image as ImageIcon, Upload, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { storageService } from '../services/storage';
import { STORAGE_PATHS } from '../config/storage';
import {
  STOREFRONT_SECTION_KEYS,
  fetchStorefrontSection,
  saveStorefrontSection,
} from '../services/storefrontCms';

export default function StorefrontBranding() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandingData, setBrandingData] = useState({
    id: null,
    colors: {
      primary: '#FF4D00',
      background: '#0D0D0D',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      muted: '#808080'
    },
    typography: {
      heading: 'Bebas Neue',
      body: 'Inter'
    },
    assets: {
      logo_url: '',
      favicon_url: ''
    },
    editorial: {
      banner_text: 'VISTA O QUE VOCÊ CARREGA',
      institutional_phrase: 'Streetwear autoral brasileiro com presença editorial.'
    },
    store_name: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchStorefrontSection(STOREFRONT_SECTION_KEYS.BRANDING);

      if (data?.content) {
        setBrandingData({
          id: data.id,
          ...data.content,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar configurações de branding');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (key, value) => {
    setBrandingData(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
  };

  const handleTypographyChange = (key, value) => {
    setBrandingData(prev => ({
      ...prev,
      typography: { ...prev.typography, [key]: value }
    }));
  };

  const handleEditorialChange = (key, value) => {
    setBrandingData(prev => ({
      ...prev,
      editorial: { ...prev.editorial, [key]: value }
    }));
  };

  const handleStoreNameChange = (value) => {
    setBrandingData(prev => ({
      ...prev,
      store_name: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      let finalLogoUrl = brandingData.assets.logo_url;

      if (logoFile) {
        finalLogoUrl = await storageService.uploadFile(logoFile, STORAGE_PATHS.BRANDING);
      }

      const contentToSave = {
        colors: brandingData.colors,
        typography: brandingData.typography,
        assets: {
          ...brandingData.assets,
          logo_url: finalLogoUrl,
        },
        editorial: brandingData.editorial,
        store_name: brandingData.store_name,
      };

      const saved = await saveStorefrontSection({
        sectionKey: STOREFRONT_SECTION_KEYS.BRANDING,
        type: 'branding',
        content: contentToSave,
        id: brandingData.id,
      });

      // Mantém header.logo_url sincronizado para consumo unificado na storefront
      const headerSection = await fetchStorefrontSection(STOREFRONT_SECTION_KEYS.HEADER);
      await saveStorefrontSection({
        sectionKey: STOREFRONT_SECTION_KEYS.HEADER,
        type: headerSection?.type || 'header_config',
        content: {
          ...(headerSection?.content || {
            sticky: true,
            transparent_on_top: true,
            height: '80',
            alignment: 'center',
          }),
          logo_url: finalLogoUrl,
        },
        id: headerSection?.id || null,
      });

      setBrandingData((prev) => ({
        ...prev,
        id: saved.id,
        assets: {
          ...prev.assets,
          logo_url: finalLogoUrl,
        },
      }));

      setLogoPreview(null);
      setLogoFile(null);
      toast.success('Branding salvo com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar branding');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white/5 animate-pulse rounded-2xl"></div>
        <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#0D0D0D] border border-white/5 p-4 rounded-2xl sticky top-4 z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-[#FF4D00]/10 p-2 rounded-xl text-[#FF4D00]">
            <Palette size={24} />
          </div>
          <div>
            <h2 className="text-xl font-heading text-white">Branding & Identidade</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Gerencie a identidade visual e editorial da loja
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Salvar Branding</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* CONFIGURAÇÕES */}
        <div className="space-y-6">
          
          {/* Cores */}
          <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <Palette size={20} className="text-white/50" />
              <h3 className="text-lg font-heading tracking-widest text-white uppercase">Sistema de Cores</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {Object.entries(brandingData.colors).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                    Cor: {key}
                  </label>
                  <div className="flex items-center gap-3 bg-[#050505] border border-white/10 rounded-xl p-2">
                    <input 
                      type="color" 
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipografia */}
          <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <Type size={20} className="text-white/50" />
              <h3 className="text-lg font-heading tracking-widest text-white uppercase">Tipografia</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Títulos (Heading)</label>
                <select 
                  value={brandingData.typography.heading}
                  onChange={(e) => handleTypographyChange('heading', e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00]"
                >
                  <option value="Bebas Neue">Bebas Neue</option>
                  <option value="Inter">Inter</option>
                  <option value="Oswald">Oswald</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Corpo de Texto</label>
                <select 
                  value={brandingData.typography.body}
                  onChange={(e) => handleTypographyChange('body', e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00]"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Lato">Lato</option>
                  <option value="Open Sans">Open Sans</option>
                </select>
              </div>
            </div>
          </div>

          {/* Identidade Visual & Assets */}
          <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <ImageIcon size={20} className="text-white/50" />
              <h3 className="text-lg font-heading tracking-widest text-white uppercase">Identidade Visual</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Nome da Loja</label>
                <input 
                  type="text" 
                  value={brandingData.store_name || ''}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  placeholder="Ex: Minha Loja"
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Logo Principal</label>
              <div className="flex items-center gap-6 bg-[#050505] border border-white/10 rounded-xl p-4">
                <div className="w-24 h-24 bg-[#1A1A1A] rounded-lg flex items-center justify-center border border-white/5 overflow-hidden">
                  {(logoPreview || brandingData.assets.logo_url) ? (
                    <img src={logoPreview || brandingData.assets.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-[var(--color-text-muted)] text-xs">Sem Logo</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/70 mb-3">Faça upload da logo em formato SVG ou PNG transparente.</p>
                  <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors">
                    <Upload size={16} /> Trocar Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={saving} />
                  </label>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* PREVIEW */}
        <div className="space-y-6">
          <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <Eye size={20} className="text-white/50" />
              <h3 className="text-lg font-heading tracking-widest text-white uppercase">Preview (Simulação)</h3>
            </div>
            
            <div className="p-6 flex-1 bg-[#050505] flex items-center justify-center">
              {/* Fake Storefront Card */}
              <div 
                className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative"
                style={{ backgroundColor: brandingData.colors.background }}
              >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                  <div className="font-heading text-xl" style={{ color: brandingData.colors.text, fontFamily: brandingData.typography.heading }}>
                    {(logoPreview || brandingData.assets.logo_url) ? (
                      <img src={logoPreview || brandingData.assets.logo_url} alt="Logo" className="h-6 object-contain" />
                    ) : brandingData.store_name}
                  </div>
                  <div className="flex gap-4" style={{ color: brandingData.colors.text }}>
                    <div className="w-4 h-4 rounded-full bg-current opacity-50"></div>
                    <div className="w-4 h-4 rounded-full bg-current opacity-50"></div>
                  </div>
                </div>

                {/* Hero */}
                <div className="p-8 text-center border-b border-white/5">
                  <h1 
                    className="text-4xl mb-4 uppercase" 
                    style={{ color: brandingData.colors.text, fontFamily: brandingData.typography.heading }}
                  >
                    {brandingData.editorial.banner_text}
                  </h1>
                  <p 
                    className="text-sm opacity-80 mb-6" 
                    style={{ color: brandingData.colors.muted, fontFamily: brandingData.typography.body }}
                  >
                    {brandingData.editorial.institutional_phrase}
                  </p>
                  <button 
                    className="px-6 py-2 rounded-full font-medium text-sm transition-opacity hover:opacity-90"
                    style={{ 
                      backgroundColor: brandingData.colors.primary, 
                      color: '#FFF',
                      fontFamily: brandingData.typography.body 
                    }}
                  >
                    COMPRAR AGORA
                  </button>
                </div>

                {/* Content */}
                <div className="p-6" style={{ backgroundColor: brandingData.colors.surface }}>
                  <div className="h-24 rounded-lg bg-black/20 flex items-center justify-center border border-white/5">
                    <span style={{ color: brandingData.colors.muted, fontFamily: brandingData.typography.body, fontSize: '0.8rem' }}>
                      Produto Destaque
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Frases Editoriais Edit */}
            <div className="p-6 border-t border-white/5 bg-[#0A0A0A]">
              <h4 className="text-sm font-heading tracking-widest text-white uppercase mb-4">Textos Editoriais</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Frase de Banner Principal</label>
                  <input 
                    type="text" 
                    value={brandingData.editorial.banner_text}
                    onChange={(e) => handleEditorialChange('banner_text', e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Frase Institucional</label>
                  <textarea 
                    value={brandingData.editorial.institutional_phrase}
                    onChange={(e) => handleEditorialChange('institutional_phrase', e.target.value)}
                    rows="2"
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}

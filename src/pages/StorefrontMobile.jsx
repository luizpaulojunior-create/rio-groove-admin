import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Smartphone, LayoutList, Layers, ToggleLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  STOREFRONT_SECTION_KEYS,
  fetchStorefrontSection,
  saveStorefrontSection,
} from '../services/storefrontCms';

export default function StorefrontMobile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileData, setMobileData] = useState({
    id: null,
    drawer: {
      position: 'right', // left, right, bottom
      animation: 'slide', // slide, fade
      backdrop_blur: true
    },
    menu: {
      style: 'accordion', // accordion, list, grid
      show_icons: false,
      expand_behavior: 'single' // single, multiple
    },
    ux: {
      spacing: 'comfortable', // compact, comfortable, relaxed
      bottom_nav: false, // show bottom navigation bar
      sticky_header: true
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchStorefrontSection(STOREFRONT_SECTION_KEYS.MOBILE);

      if (data?.content) {
        setMobileData({
          id: data.id,
          ...data.content,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar configurações mobile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, key, value) => {
    setMobileData(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const saved = await saveStorefrontSection({
        sectionKey: STOREFRONT_SECTION_KEYS.MOBILE,
        type: 'mobile_experience',
        content: {
          drawer: mobileData.drawer,
          menu: mobileData.menu,
          ux: mobileData.ux,
        },
        id: mobileData.id,
      });

      setMobileData((prev) => ({ ...prev, id: saved.id }));

      toast.success('Experiência Mobile salva com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar experiência mobile');
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
            <Smartphone size={24} />
          </div>
          <div>
            <h2 className="text-xl font-heading text-white">Mobile Experience</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Configure o comportamento e interface para dispositivos móveis
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Salvar Mobile UX</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Drawer Settings */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <LayoutList size={20} className="text-white/50" />
            <h3 className="text-lg font-heading tracking-widest text-white uppercase">Mobile Drawer</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Posição de Abertura</label>
              <select 
                value={mobileData.drawer.position}
                onChange={(e) => handleChange('drawer', 'position', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00]"
              >
                <option value="right">Direita (Deslizar)</option>
                <option value="left">Esquerda (Deslizar)</option>
                <option value="bottom">Abaixo (BottomSheet)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Animação de Entrada</label>
              <select 
                value={mobileData.drawer.animation}
                onChange={(e) => handleChange('drawer', 'animation', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00]"
              >
                <option value="slide">Deslizamento (Slide)</option>
                <option value="fade">Esmaecimento (Fade)</option>
              </select>
            </div>
            <div className="flex items-center justify-between bg-[#050505] border border-white/10 p-4 rounded-xl">
              <div>
                <span className="block text-sm text-white font-medium">Backdrop Blur</span>
                <span className="text-xs text-[var(--color-text-muted)]">Desfocar o fundo ao abrir o menu</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={mobileData.drawer.backdrop_blur}
                  onChange={(e) => handleChange('drawer', 'backdrop_blur', e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Menu & Accordions */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Layers size={20} className="text-white/50" />
            <h3 className="text-lg font-heading tracking-widest text-white uppercase">Accordions & Menu</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Estilo do Menu</label>
              <select 
                value={mobileData.menu.style}
                onChange={(e) => handleChange('menu', 'style', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00]"
              >
                <option value="accordion">Accordion (Sanfona)</option>
                <option value="list">Lista Simples</option>
                <option value="grid">Grid (Ícones + Texto)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Comportamento de Expansão</label>
              <select 
                value={mobileData.menu.expand_behavior}
                onChange={(e) => handleChange('menu', 'expand_behavior', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00]"
                disabled={mobileData.menu.style !== 'accordion'}
              >
                <option value="single">Um por vez (fecha os outros)</option>
                <option value="multiple">Múltiplos simultâneos</option>
              </select>
            </div>
            <div className="flex items-center justify-between bg-[#050505] border border-white/10 p-4 rounded-xl">
              <div>
                <span className="block text-sm text-white font-medium">Exibir Ícones</span>
                <span className="text-xs text-[var(--color-text-muted)]">Ícones ao lado dos itens do menu</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={mobileData.menu.show_icons}
                  onChange={(e) => handleChange('menu', 'show_icons', e.target.checked)}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* UX e Navegação */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <ToggleLeft size={20} className="text-white/50" />
            <h3 className="text-lg font-heading tracking-widest text-white uppercase">UX & Navegação</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Espaçamento Mobile (Spacing)</label>
              <select 
                value={mobileData.ux.spacing}
                onChange={(e) => handleChange('ux', 'spacing', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00]"
              >
                <option value="compact">Compacto (Mais conteúdo)</option>
                <option value="comfortable">Confortável (Padrão Editorial)</option>
                <option value="relaxed">Relaxado (Mais respiro/Premium)</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#050505] border border-white/10 p-4 rounded-xl">
                <div>
                  <span className="block text-sm text-white font-medium">Header Fixo (Sticky)</span>
                  <span className="text-xs text-[var(--color-text-muted)]">O cabeçalho acompanha a rolagem</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={mobileData.ux.sticky_header}
                    onChange={(e) => handleChange('ux', 'sticky_header', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between bg-[#050505] border border-white/10 p-4 rounded-xl">
                <div>
                  <span className="block text-sm text-white font-medium">Bottom Navigation</span>
                  <span className="text-xs text-[var(--color-text-muted)]">Barra de ícones no rodapé estilo App</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={mobileData.ux.bottom_nav}
                    onChange={(e) => handleChange('ux', 'bottom_nav', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00]"></div>
                </label>
              </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* Preview Simulator */}
      <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <h3 className="text-lg font-heading tracking-widest text-white uppercase">Preview Interativo</h3>
          <span className="text-xs bg-[#FF4D00]/20 text-[#FF4D00] px-3 py-1 rounded-full">Simulação Visual</span>
        </div>
        <div className="p-8 flex items-center justify-center bg-[#050505] relative overflow-hidden h-[500px]">
          
          {/* Fake Mobile Device */}
          <div className="w-[320px] h-[600px] border-[8px] border-[#1A1A1A] rounded-[3rem] bg-black relative shadow-2xl flex flex-col overflow-hidden">
            
            {/* Fake Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black z-20 ${mobileData.ux.sticky_header ? 'sticky top-0' : ''}`}>
              <div className="text-white font-heading text-xl">R/G</div>
              <div className="w-6 h-4 flex flex-col justify-between">
                <div className="w-full h-[2px] bg-white"></div>
                <div className="w-full h-[2px] bg-white"></div>
                <div className="w-full h-[2px] bg-white"></div>
              </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto ${mobileData.ux.spacing === 'compact' ? 'space-y-4 p-4' : mobileData.ux.spacing === 'comfortable' ? 'space-y-6 p-6' : 'space-y-8 p-8'}`}>
              <div className="h-40 bg-white/5 rounded-xl flex items-center justify-center">Banner</div>
              <div className="h-24 bg-white/5 rounded-xl flex items-center justify-center">Destaque 1</div>
              <div className="h-24 bg-white/5 rounded-xl flex items-center justify-center">Destaque 2</div>
              <div className="h-24 bg-white/5 rounded-xl flex items-center justify-center">Destaque 3</div>
            </div>

            {/* Fake Drawer Preview (If active in real state, but here just static rep) */}
            <div 
              className={`absolute top-0 bottom-0 w-3/4 bg-[#0D0D0D] border-l border-white/10 z-30 transition-transform duration-500 ease-in-out flex flex-col
                ${mobileData.drawer.position === 'right' ? 'right-0 translate-x-12 opacity-50' : mobileData.drawer.position === 'left' ? 'left-0 -translate-x-12 opacity-50' : 'bottom-0 left-0 right-0 w-full h-1/2 translate-y-12 opacity-50'}
              `}
            >
              <div className="p-4 border-b border-white/5 font-heading">MENU</div>
              <div className="p-4 space-y-4">
                {mobileData.menu.style === 'accordion' ? (
                  <>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-sm">Coleções <span>+</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-sm">Masculino <span>+</span></div>
                  </>
                ) : mobileData.menu.style === 'list' ? (
                  <>
                    <div className="text-sm border-b border-white/5 pb-2">Coleções</div>
                    <div className="text-sm border-b border-white/5 pb-2">Masculino</div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 h-16 rounded flex items-center justify-center text-xs">C1</div>
                    <div className="bg-white/5 h-16 rounded flex items-center justify-center text-xs">C2</div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Nav */}
            {mobileData.ux.bottom_nav && (
              <div className="h-14 bg-[#111] border-t border-white/5 flex items-center justify-around px-4 z-20">
                <div className="w-5 h-5 rounded-full bg-white/20"></div>
                <div className="w-5 h-5 rounded-full bg-white/20"></div>
                <div className="w-5 h-5 rounded-full bg-white/20"></div>
              </div>
            )}
            
          </div>

        </div>
      </div>

    </div>
  );
}

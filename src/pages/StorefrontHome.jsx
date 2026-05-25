import React, { useState, useEffect } from 'react';
import { Upload, Save, RefreshCw, LayoutTemplate, Image as ImageIcon, Link as LinkIcon, MoveUp, MoveDown, Eye, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { STORAGE_PATHS } from '../config/storage';
import { storageService } from '../services/storage';
import {
  STOREFRONT_SECTION_KEYS,
  fetchAllStorefrontSections,
  saveStorefrontSection,
  ensureStorefrontSection,
} from '../services/storefrontCms';

export default function StorefrontHome() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homeData, setHomeData] = useState({
    hero_id: null,
    hero_title: 'VISTA O QUE VOCÊ CARREGA',
    hero_subtitle: 'Streetwear autoral brasileiro com presença editorial, cultura urbana e ancestralidade em peças premium para quem transforma identidade em movimento.',
    hero_cta_text: 'VER COLEÇÕES',
    hero_cta_link: '/collections',
    hero_image_desktop: 'https://images.unsplash.com/photo-1523398002811-999aa8d9512e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    hero_image_mobile: 'https://images.unsplash.com/photo-1523398002811-999aa8d9512e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    featured_collection_id: null,
    home_sections_order: ['hero', 'campaigns', 'featured_products']
  });

  const [collections, setCollections] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [desktopImageFile, setDesktopImageFile] = useState(null);
  const [mobileImageFile, setMobileImageFile] = useState(null);

  const fetchData = async (showLoading = true) => {
    try {
      
      // Fetch collections for dropdown
      const { data: colsData, error: colsError } = await supabase
        .from('collections')
        .select('id, name, slug')
        .order('name');
        
      if (!colsError && colsData) {
        setCollections(colsData);
      }

      // Fetch sections via CMS service
      const data = await fetchAllStorefrontSections();

      if (data && data.length > 0) {
        const heroSection = data.find(s => s.section_key === STOREFRONT_SECTION_KEYS.HERO);
        const sectionsOrder = data.sort((a, b) => a.order_index - b.order_index).map(s => s.section_key);

        let heroContent = { slides: [{}] };
        if (heroSection?.content) {
          heroContent = heroSection.content;
        }

        const slide = heroContent.slides?.[0] || {};
        
        let titleFull = slide.headline_part1 || '';
        if (slide.headline_part2) {
          titleFull += ' ' + slide.headline_part2;
        }
        
        const finalTitle = titleFull || heroContent.headline || heroContent.title || 'VISTA O QUE VOCÊ CARREGA';
        const finalSubtitle = slide.subtitle || heroContent.subtitle || '';
        const finalCtaText = slide.cta_text || heroContent.button_text || heroContent.cta_text || '';
        const finalCtaLink = slide.cta_link || heroContent.button_link || heroContent.cta_link || '';
        const finalImageDesktop = slide.image_url || heroContent.image_url || '';
        const finalImageMobile = slide.image_url_mobile || heroContent.image_url_mobile || heroContent.image_url || '';

        setHomeData(prev => ({
          ...prev,
          hero_id: heroSection?.id || null,
          hero_title: finalTitle,
          hero_subtitle: finalSubtitle,
          hero_cta_text: finalCtaText,
          hero_cta_link: finalCtaLink,
          hero_image_desktop: finalImageDesktop,
          hero_image_mobile: finalImageMobile,
          home_sections_order: sectionsOrder.length > 0 ? sectionsOrder : ['hero', 'campaigns', 'featured_products'],
          sections: data // Guardar os dados completos das sections
        }));
        setLastUpdated(heroSection?.updated_at || new Date().toISOString());
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados da Home');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHomeData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    
    if (field === 'hero_image_desktop') {
      setDesktopImageFile(file);
    } else {
      setMobileImageFile(file);
    }

    setHomeData(prev => ({ ...prev, [field]: previewUrl }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let finalDesktopUrl = homeData.hero_image_desktop;
      let finalMobileUrl = homeData.hero_image_mobile;

      if (desktopImageFile) {
        finalDesktopUrl = await storageService.uploadFile(desktopImageFile, STORAGE_PATHS.HERO);
      }

      if (mobileImageFile) {
        finalMobileUrl = await storageService.uploadFile(mobileImageFile, STORAGE_PATHS.HERO);
      }

      const titleParts = (homeData.hero_title || '').split(' ');
      const part2 = titleParts.pop() || '';
      const part1 = titleParts.join(' ');

      const heroContent = {
        headline: homeData.hero_title,
        title: homeData.hero_title,
        subtitle: homeData.hero_subtitle,
        button_text: homeData.hero_cta_text,
        button_link: homeData.hero_cta_link,
        cta_text: homeData.hero_cta_text,
        cta_link: homeData.hero_cta_link,
        image_url: finalDesktopUrl,
        image_url_mobile: finalMobileUrl,
        slides: [
          {
            headline_part1: part1,
            headline_part2: part2,
            subtitle: homeData.hero_subtitle,
            cta_text: homeData.hero_cta_text,
            cta_link: homeData.hero_cta_link,
            image_url: finalDesktopUrl,
            image_url_mobile: finalMobileUrl,
          },
        ],
        autoplay: true,
        autoplay_interval: 5000,
      };

      const saved = await saveStorefrontSection({
        sectionKey: STOREFRONT_SECTION_KEYS.HERO,
        type: 'hero',
        content: heroContent,
        id: homeData.hero_id,
        orderIndex: homeData.home_sections_order.indexOf('hero') * 10 || 10,
      });

      if (!homeData.hero_id && saved?.id) {
        setHomeData(prev => ({ ...prev, hero_id: saved.id }));
      }

      for (let i = 0; i < homeData.home_sections_order.length; i++) {
        const sectionType = homeData.home_sections_order[i];
        if (sectionType === 'hero') continue;

        await ensureStorefrontSection({
          sectionKey: sectionType,
          type: sectionType,
          orderIndex: i * 10,
        });
      }

      setDesktopImageFile(null);
      setMobileImageFile(null);
      setHomeData(prev => ({
        ...prev,
        hero_image_desktop: finalDesktopUrl,
        hero_image_mobile: finalMobileUrl
      }));

      toast.success('Configurações salvas com sucesso');
      setLastUpdated(new Date().toISOString());
      
      // Recarregar os dados para atualizar os IDs das seções recém-criadas
      fetchData(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index, direction) => {
    const newOrder = [...homeData.home_sections_order];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    setHomeData(prev => ({ ...prev, home_sections_order: newOrder }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white/5 animate-pulse rounded-2xl"></div>
        <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  const sectionLabels = {
    'hero': 'Hero Principal',
    'campaigns': 'Campanhas',
    'featured_products': 'Vitrines & Produtos',
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-[#0D0D0D] border border-white/5 p-4 rounded-2xl sticky top-4 z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-[#FF4D00]/10 p-2 rounded-xl text-[#FF4D00]">
            <LayoutTemplate size={24} />
          </div>
          <div>
            <h2 className="text-xl font-heading text-white">Configurações da Home</h2>
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

      {/* CARD HERO */}
      <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
          <ImageIcon size={20} className="text-[#FF4D00]" />
          <h3 className="text-lg font-heading tracking-widest text-white uppercase">Card Hero</h3>
        </div>
        
        <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Desktop Image */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Imagem Desktop</label>
                <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/50">
                  {homeData.hero_image_desktop ? (
                    <img src={homeData.hero_image_desktop} alt="Hero Desktop" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/20">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-[#FF4D00] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#e64500]">
                      <Upload size={16} /> Trocar Imagem
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'hero_image_desktop')} disabled={saving} />
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Mobile Image */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Imagem Mobile</label>
                <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/4] bg-black/50 mx-auto w-2/3">
                  {homeData.hero_image_mobile ? (
                    <img src={homeData.hero_image_mobile} alt="Hero Mobile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/20">
                      <Smartphone size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-[#FF4D00] text-white p-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#e64500]">
                      <Upload size={16} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'hero_image_mobile')} disabled={saving} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Título Principal</label>
                <input 
                  type="text" 
                  name="hero_title"
                  value={homeData.hero_title}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-colors"
                  placeholder="Ex: VISTA O QUE VOCÊ CARREGA"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Subtítulo</label>
                <textarea 
                  name="hero_subtitle"
                  value={homeData.hero_subtitle}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-colors resize-none"
                  placeholder="Texto descritivo do banner..."
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Texto do Botão (CTA)</label>
                  <input 
                    type="text" 
                    name="hero_cta_text"
                    value={homeData.hero_cta_text}
                    onChange={handleChange}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-colors"
                    placeholder="Ex: VER COLEÇÕES"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Link do Botão</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input 
                      type="text" 
                      name="hero_cta_link"
                      value={homeData.hero_cta_link}
                      onChange={handleChange}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-colors"
                      placeholder="Ex: /collections"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview Hero */}
          <div className="bg-[#050505] border border-white/5 rounded-xl p-4 flex flex-col">
            <h4 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
              <Eye size={14} /> Preview (Simulação)
            </h4>
            
            <div className="relative flex-1 rounded-lg overflow-hidden flex items-center justify-center p-8 bg-black">
              {/* Imagem de Fundo (Simulada) */}
              <div className="absolute inset-0">
                <img src={homeData.hero_image_desktop} alt="" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent"></div>
              </div>
              
              {/* Conteúdo */}
              <div className="relative z-10 max-w-md w-full text-left">
                <h2 className="font-bebas uppercase text-5xl leading-none text-white mb-4">
                  {(homeData.hero_title || '').split(' ').map((word, i, arr) => (
                    <span key={i} className={i === arr.length - 1 ? 'text-[#FF4D00]' : 'text-white'}>
                      {word}{' '}
                    </span>
                  ))}
                </h2>
                <p className="font-sans text-sm text-white/80 mb-6 line-clamp-3">
                  {homeData.hero_subtitle}
                </p>
                <button className="bg-[#FF4D00]/10 border border-[#FF4D00] text-white px-6 py-2 rounded-full font-bebas text-lg tracking-wider">
                  {homeData.hero_cta_text}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARD VITRINES & SEÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Coleção Destaque */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-heading tracking-widest text-white uppercase">Card Vitrines</h3>
          </div>
          <div className="p-6 flex-1">
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Selecione qual coleção deve ter destaque primário na home (se aplicável ao layout).
            </p>
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Coleção Destaque</label>
              <select
                name="featured_collection_id"
                value={homeData.featured_collection_id || ''}
                onChange={handleChange}
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-colors appearance-none"
              >
                <option value="">-- Automático (Mais Vendidos/Lançamentos) --</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ordenação de Seções */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-heading tracking-widest text-white uppercase">Card Seções (Ordem)</h3>
          </div>
          <div className="p-6 flex-1">
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Ordene as seções principais da Home. Futuramente habilitaremos Drag & Drop.
            </p>
            
            <div className="space-y-2">
              {homeData.home_sections_order.map((section, index) => (
                <div key={section} className="flex items-center justify-between bg-[#050505] border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 font-mono text-xs">
                      {index + 1}
                    </div>
                    <span className="text-white font-medium">{sectionLabels[section] || section}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded disabled:opacity-30"
                    >
                      <MoveUp size={16} />
                    </button>
                    <button 
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === homeData.home_sections_order.length - 1}
                      className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded disabled:opacity-30"
                    >
                      <MoveDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

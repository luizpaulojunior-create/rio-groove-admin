import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Globe, Plus, Trash2, MoveUp, MoveDown, ChevronDown, ChevronUp, Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { STORAGE_PATHS } from '../config/storage';
import { storageService } from '../services/storage';
import {
  STOREFRONT_SECTION_KEYS,
  fetchStorefrontSection,
  saveStorefrontSection,
} from '../services/storefrontCms';
import { NAVIGATION_SEED_ITEMS } from '../config/navigationSeed';

export default function StorefrontNavigation() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navId, setNavId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [uploadingEditorialId, setUploadingEditorialId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchStorefrontSection(STOREFRONT_SECTION_KEYS.NAVIGATION);

      if (data) {
        setNavId(data.id);
        setMenuItems(data.content?.items || []);
        setLastUpdated(data.updated_at);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar navegação');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const saved = await saveStorefrontSection({
        sectionKey: STOREFRONT_SECTION_KEYS.NAVIGATION,
        type: 'navigation_config',
        content: { items: menuItems },
        id: navId,
      });

      if (!navId) {
        setNavId(saved.id);
      }

      toast.success('Navegação salva com sucesso');
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar navegação');
    } finally {
      setSaving(false);
    }
  };

  const handleImportSeed = async () => {
    if (!window.confirm('Substituir o menu atual pelo padrão editorial Rio Groove (7 itens)?')) {
      return;
    }
    try {
      setSaving(true);
      setMenuItems(NAVIGATION_SEED_ITEMS);
      const saved = await saveStorefrontSection({
        sectionKey: STOREFRONT_SECTION_KEYS.NAVIGATION,
        type: 'navigation_config',
        content: { items: NAVIGATION_SEED_ITEMS },
        id: navId,
        orderIndex: 5,
      });
      if (!navId) setNavId(saved.id);
      toast.success('Menu padrão importado e salvo');
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error(err);
      toast.error('Erro ao importar menu. Verifique login admin e RLS.');
    } finally {
      setSaving(false);
    }
  };

  const addMenuItem = () => {
    const newItem = {
      id: Date.now().toString(),
      label: 'Novo Item',
      link: '/',
      hasSubmenu: false,
      subItems: [],
      editorialText: '',
      editorialCtaText: '',
      editorialCtaLink: ''
    };
    setMenuItems([...menuItems, newItem]);
    setExpandedItem(newItem.id);
  };

  const removeMenuItem = (id) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const updateMenuItem = (id, field, value) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleEditorialImageUpload = async (itemId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingEditorialId(itemId);
      const publicUrl = await storageService.uploadFile(file, STORAGE_PATHS.NAVIGATION);
      updateMenuItem(itemId, 'editorialImage', publicUrl);
      toast.success('Imagem enviada para a biblioteca. Clique em Salvar para publicar.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploadingEditorialId(null);
      event.target.value = '';
    }
  };

  const removeEditorialImage = (itemId) => {
    updateMenuItem(itemId, 'editorialImage', '');
    toast.info('Imagem removida desta seção. Salve para publicar.');
  };

  const moveItem = (index, direction) => {
    const newItems = [...menuItems];
    if (direction === 'up' && index > 0) {
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    }
    setMenuItems(newItems);
  };

  const addSubItem = (parentId) => {
    setMenuItems(menuItems.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          subItems: [...(item.subItems || []), { label: 'Novo Sublink', link: '/' }]
        };
      }
      return item;
    }));
  };

  const updateSubItem = (parentId, index, field, value) => {
    setMenuItems(menuItems.map(item => {
      if (item.id === parentId) {
        const newSubItems = [...item.subItems];
        newSubItems[index] = { ...newSubItems[index], [field]: value };
        return { ...item, subItems: newSubItems };
      }
      return item;
    }));
  };

  const removeSubItem = (parentId, index) => {
    setMenuItems(menuItems.map(item => {
      if (item.id === parentId) {
        return { ...item, subItems: item.subItems.filter((_, i) => i !== index) };
      }
      return item;
    }));
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
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-xl font-heading text-white">Configurações de Navegação</h2>
            {lastUpdated && (
              <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                <RefreshCw size={10} /> Última sincronização: {new Date(lastUpdated).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleImportSeed}
            disabled={saving}
            className="btn-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-white text-sm"
            title="Substitui pelo menu editorial atual (7 itens)"
          >
            <RefreshCw size={16} />
            Aplicar menu editorial
          </button>
          <button 
            onClick={addMenuItem}
            className="btn-secondary flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-white"
          >
            <Plus size={18} />
            <span>Adicionar Menu</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed bg-[#FF4D00] text-white hover:bg-[#e64500]"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-6">
        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <div key={item.id} className="border border-white/10 rounded-xl overflow-hidden bg-[#050505]">
              <div 
                className="flex items-center justify-between p-4 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }}
                      disabled={index === 0}
                      className="p-1 text-white/50 hover:text-white disabled:opacity-30"
                    >
                      <MoveUp size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }}
                      disabled={index === menuItems.length - 1}
                      className="p-1 text-white/50 hover:text-white disabled:opacity-30"
                    >
                      <MoveDown size={16} />
                    </button>
                  </div>
                  <span className="text-white font-medium">{item.label}</span>
                  <span className="text-xs text-[var(--color-text-muted)] bg-white/5 px-2 py-1 rounded">
                    {item.link}
                  </span>
                  {item.hasSubmenu && (
                    <span className="text-xs text-[#FF4D00] bg-[#FF4D00]/10 px-2 py-1 rounded border border-[#FF4D00]/20">
                      Com Submenu
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeMenuItem(item.id); }}
                    className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedItem === item.id ? <ChevronUp size={20} className="text-white/50" /> : <ChevronDown size={20} className="text-white/50" />}
                </div>
              </div>

              {expandedItem === item.id && (
                <div className="p-6 border-t border-white/5 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Label do Menu</label>
                      <input 
                        type="text" 
                        value={item.label}
                        onChange={(e) => updateMenuItem(item.id, 'label', e.target.value)}
                        className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Link Base (Slug/URL)</label>
                      <input 
                        type="text" 
                        value={item.link}
                        onChange={(e) => updateMenuItem(item.id, 'link', e.target.value)}
                        className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-6">
                    <div>
                      <label className="text-sm font-medium text-white block mb-1">Ativar Submenu (Megamenu)</label>
                      <p className="text-xs text-[var(--color-text-muted)]">Exibe links adicionais e destaque editorial no hover.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={item.hasSubmenu} 
                        onChange={(e) => updateMenuItem(item.id, 'hasSubmenu', e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00]"></div>
                    </label>
                  </div>

                  {item.hasSubmenu && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-white/5 pt-6">
                      {/* Sublinks */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-xs uppercase tracking-wider text-white">Sublinks</label>
                          <button 
                            onClick={() => addSubItem(item.id)}
                            className="text-xs text-[#FF4D00] hover:text-white flex items-center gap-1"
                          >
                            <Plus size={14} /> Adicionar Link
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(item.subItems || []).map((sub, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2">
                              <input 
                                type="text" 
                                placeholder="Nome"
                                value={sub.label}
                                onChange={(e) => updateSubItem(item.id, sIdx, 'label', e.target.value)}
                                className="w-1/3 bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                              />
                              <input 
                                type="text" 
                                placeholder="URL (/colecao/algo)"
                                value={sub.link}
                                onChange={(e) => updateSubItem(item.id, sIdx, 'link', e.target.value)}
                                className="flex-1 bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                              />
                              <button 
                                onClick={() => removeSubItem(item.id, sIdx)}
                                className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {(!item.subItems || item.subItems.length === 0) && (
                            <p className="text-xs text-[var(--color-text-muted)] italic">Nenhum sublink adicionado.</p>
                          )}
                        </div>
                      </div>

                      {/* Editorial do Megamenu */}
                      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-4">
                        <label className="block text-xs uppercase tracking-wider text-white border-b border-white/5 pb-2">Destaque Editorial (Opcional)</label>
                        <div>
                          <label className="block text-xs text-[var(--color-text-muted)] mb-2">Imagem editorial</label>
                          <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[4/5] bg-black/40 max-h-52">
                            {item.editorialImage ? (
                              <img
                                src={item.editorialImage}
                                alt={`Destaque ${item.label}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full min-h-[10rem] text-white/25 gap-2">
                                <ImageIcon size={28} />
                                <span className="text-xs">Nenhuma imagem</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label className={`cursor-pointer bg-[#FF4D00] text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-[#e64500] ${uploadingEditorialId === item.id ? 'opacity-60 pointer-events-none' : ''}`}>
                                {uploadingEditorialId === item.id ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Upload size={14} />
                                )}
                                {uploadingEditorialId === item.id ? 'Enviando…' : 'Da biblioteca'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingEditorialId === item.id}
                                  onChange={(e) => handleEditorialImageUpload(item.id, e)}
                                />
                              </label>
                              {item.editorialImage && (
                                <button
                                  type="button"
                                  onClick={() => removeEditorialImage(item.id)}
                                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-red-500/80"
                                  title="Remover imagem"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-[var(--color-text-muted)] mt-2">
                            Envie PNG ou JPG — salva na biblioteca do site (não use link externo).
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                            Frase Curta
                            <span className="block text-[10px] text-white/35 font-normal mt-0.5">
                              Em branco = só a imagem, sem texto por cima.
                            </span>
                          </label>
                          <input 
                            type="text" 
                            value={item.editorialText || ''}
                            onChange={(e) => updateMenuItem(item.id, 'editorialText', e.target.value)}
                            placeholder="Ex: Nova Coleção Urban"
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1">CTA Texto</label>
                            <input 
                              type="text" 
                              value={item.editorialCtaText || ''}
                              onChange={(e) => updateMenuItem(item.id, 'editorialCtaText', e.target.value)}
                              placeholder="Ex: Ver Coleção"
                              className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--color-text-muted)] mb-1">CTA Link</label>
                            <input 
                              type="text" 
                              value={item.editorialCtaLink || ''}
                              onChange={(e) => updateMenuItem(item.id, 'editorialCtaLink', e.target.value)}
                              placeholder="/drop-02"
                              className="w-full bg-[#0D0D0D] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {menuItems.length === 0 && (
            <div className="text-center py-12 bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
              <Globe size={32} className="mx-auto text-white/20 mb-3" />
              <p className="text-[var(--color-text-muted)] text-sm">Nenhum item no menu de navegação.</p>
              <button 
                onClick={addMenuItem}
                className="mt-4 text-[#FF4D00] hover:text-[#e64500] text-sm font-medium"
              >
                + Criar Primeiro Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

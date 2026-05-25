import React, { useState, useEffect } from 'react';
import { Upload, Save, Plus, Edit2, Trash2, Image as ImageIcon, Layout } from 'lucide-react';
import { toast } from 'react-toastify';
import { storageService } from '../services/storage';
import { STORAGE_PATHS } from '../config/storage';
import {
  fetchLandingPages,
  saveLandingPage,
  deleteLandingPage,
} from '../services/storefrontCms';
import Modal from '../components/Modal';

export default function StorefrontLandingPages() {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    slug: '',
    description: '',
    type: 'collection',
    hero_banner_url: '',
    editorial_phrase: '',
    cta_text: '',
    cta_link: '',
    images: [],
    sections_order: ['hero', 'products', 'editorial'],
    active: true
  });

  const [heroFile, setHeroFile] = useState(null);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setTableMissing(false);
      const data = await fetchLandingPages();
      setPages(data);
    } catch (err) {
      console.error(err);
      if (err.code === 'LANDING_PAGES_TABLE_MISSING') {
        setTableMissing(true);
        toast.error('Tabela landing_pages ausente. Execute a migration SQL.');
      } else {
        toast.error('Erro ao carregar landing pages.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (page) => {
    setFormData({
      id: page.id,
      title: page.title || '',
      slug: page.slug || '',
      description: page.description || '',
      type: page.type || 'collection',
      hero_banner_url: page.hero_banner_url || '',
      editorial_phrase: page.editorial_phrase || '',
      cta_text: page.cta_text || '',
      cta_link: page.cta_link || '',
      images: page.images || [],
      sections_order: page.sections_order || ['hero', 'products', 'editorial'],
      active: page.active !== false
    });
    setHeroFile(null);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData({
      id: null,
      title: '',
      slug: '',
      description: '',
      type: 'collection',
      hero_banner_url: '',
      editorial_phrase: '',
      cta_text: '',
      cta_link: '',
      images: [],
      sections_order: ['hero', 'products', 'editorial'],
      active: true
    });
    setHeroFile(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroFile(file);
      setFormData(prev => ({ ...prev, hero_banner_url: URL.createObjectURL(file) }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      let finalHeroUrl = formData.hero_banner_url;

      if (heroFile) {
        finalHeroUrl = await storageService.uploadFile(heroFile, STORAGE_PATHS.EDITORIAL);
      }

      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        type: formData.type,
        hero_banner_url: finalHeroUrl,
        editorial_phrase: formData.editorial_phrase,
        cta_text: formData.cta_text,
        cta_link: formData.cta_link,
        images: formData.images,
        sections_order: formData.sections_order,
        active: formData.active,
      };

      await saveLandingPage(payload, formData.id || null);
      toast.success(formData.id ? 'Landing page atualizada com sucesso!' : 'Landing page criada com sucesso!');

      setIsModalOpen(false);
      fetchPages();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar landing page.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta landing page?')) return;
    try {
      await deleteLandingPage(id);
      toast.success('Landing page excluída!');
      fetchPages();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir landing page.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading text-white uppercase tracking-wider">Landing Pages & Collections</h2>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Gerencie páginas editoriais, campanhas e drops.</p>
        </div>
        {!tableMissing && (
          <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nova Página
          </button>
        )}
      </div>

      {tableMissing && (
        <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/30 rounded-3xl p-6 text-white">
          <h3 className="font-heading text-lg mb-2">Migration necessária</h3>
          <p className="text-sm text-white/80 mb-2">
            A tabela <code className="text-[#FF4D00]">landing_pages</code> não existe no Supabase.
          </p>
          <p className="text-sm text-white/60">
            Execute o arquivo <strong>supabase/fase4b_landing_pages.sql</strong> no SQL Editor do Supabase e recarregue esta página.
          </p>
        </div>
      )}

      <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Título</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Tipo</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Slug</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pages.map(page => (
              <tr key={page.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {page.hero_banner_url ? (
                        <img src={page.hero_banner_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Layout size={16} className="text-white/20" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{page.title}</div>
                      <div className="text-xs text-white/40">{page.editorial_phrase || 'Sem frase editorial'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${
                    page.type === 'collection' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    page.type === 'campaign' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  }`}>
                    {page.type}
                  </span>
                </td>
                <td className="p-4 text-sm text-white/70">/{page.slug}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${page.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {page.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(page)} className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(page.id)} className="p-2 text-white/50 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-white/40">
                  Nenhuma landing page encontrada. Certifique-se de ter rodado a migration 02_MIGRATION_LANDING_PAGES.sql.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Editar Landing Page" : "Nova Landing Page"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Esquerda: Infos Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/10 pb-2 mb-4">Informações Básicas</h3>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Título da Página</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" placeholder="Ex: Luz & Proteção" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Slug (URL)</label>
                  <input required type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" placeholder="ex: luz-e-protecao" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Tipo</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]">
                    <option value="collection">Collection</option>
                    <option value="campaign">Campaign</option>
                    <option value="drop">Drop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Descrição Breve</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="2" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#FF4D00] resize-none" placeholder="Descrição para SEO e cabeçalho..."></textarea>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="active" name="active" checked={formData.active} onChange={handleChange} className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#FF4D00] focus:ring-[#FF4D00]" />
                <label htmlFor="active" className="text-sm text-white/70">Página Ativa e Visível</label>
              </div>
            </div>

            {/* Direita: Conteúdo Editorial */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/10 pb-2 mb-4">Conteúdo Editorial</h3>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Hero Banner</label>
                <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/50">
                  {formData.hero_banner_url ? (
                    <img src={formData.hero_banner_url} alt="Hero" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/20">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-[#FF4D00] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <Upload size={16} /> Trocar Imagem
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Frase Editorial Principal</label>
                <input type="text" name="editorial_phrase" value={formData.editorial_phrase} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" placeholder="Ex: A força que nos guia" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">CTA Text</label>
                  <input type="text" name="cta_text" value={formData.cta_text} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" placeholder="Ex: Ver Coleção" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">CTA Link</label>
                  <input type="text" name="cta_link" value={formData.cta_link} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" placeholder="Ex: /products" />
                </div>
              </div>

            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-white/70 hover:bg-white/5 transition-colors font-medium">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-8 py-2 rounded-xl">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
              Salvar Página
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

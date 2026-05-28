import React, { useState, useEffect } from 'react';
import { Upload, Save, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { storageService } from '../services/storage';
import { STORAGE_PATHS } from '../config/storage';
import {
  fetchEditorialPosts,
  saveLandingPage,
  deleteLandingPage,
} from '../services/storefrontCms';
import Modal from '../components/Modal';

const emptyForm = {
  id: null,
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  hero_banner_url: '',
  editorial_phrase: '',
  active: true,
};

export default function Editorial() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [heroFile, setHeroFile] = useState(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setTableMissing(false);
      const data = await fetchEditorialPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
      if (err.code === 'LANDING_PAGES_TABLE_MISSING') {
        setTableMissing(true);
        toast.error('Tabela landing_pages ausente. Execute a migration SQL.');
      } else {
        toast.error('Erro ao carregar artigos editoriais.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = (post) => {
    setFormData({
      id: post.id,
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      body: post.body || '',
      hero_banner_url: post.hero_banner_url || '',
      editorial_phrase: post.editorial_phrase || '',
      active: post.active !== false,
    });
    setHeroFile(null);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData(emptyForm);
    setHeroFile(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroFile(file);
      setFormData((prev) => ({ ...prev, hero_banner_url: URL.createObjectURL(file) }));
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
        description: formData.excerpt,
        excerpt: formData.excerpt,
        body: formData.body,
        type: 'editorial',
        hero_banner_url: finalHeroUrl,
        editorial_phrase: formData.editorial_phrase || formData.excerpt,
        cta_text: 'Ler artigo',
        cta_link: `/movimentos/editorial/${formData.slug}`,
        images: [],
        sections_order: ['hero', 'body'],
        active: formData.active,
      };

      await saveLandingPage(payload, formData.id || null);
      toast.success(formData.id ? 'Artigo atualizado!' : 'Artigo publicado!');
      setIsModalOpen(false);
      fetchPosts();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar artigo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este artigo editorial?')) return;
    try {
      await deleteLandingPage(id);
      toast.success('Artigo excluído!');
      fetchPosts();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir artigo.');
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
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading tracking-widest text-white uppercase">Editorial</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Mini blog em Movimentos — artigos com hero, resumo e corpo.
          </p>
        </div>
        {!tableMissing && (
          <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Artigo
          </button>
        )}
      </div>

      {tableMissing && (
        <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/30 rounded-3xl p-6 text-white">
          <h3 className="font-heading text-lg mb-2">Migration necessária</h3>
          <p className="text-sm text-white/80">
            Execute <strong>supabase/fase4b_landing_pages.sql</strong> e <strong>11_movimentos_cms.sql</strong> no Supabase.
          </p>
        </div>
      )}

      <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Título</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Slug</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-black border border-white/10 overflow-hidden shrink-0">
                      {post.hero_banner_url ? (
                        <img src={post.hero_banner_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={16} className="text-white/20" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{post.title}</div>
                      <div className="text-xs text-white/40 line-clamp-1">{post.excerpt || post.editorial_phrase || 'Sem resumo'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-white/70">/movimentos/editorial/{post.slug}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${post.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {post.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(post)} className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="p-2 text-white/50 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-white/40">
                  Nenhum artigo editorial. Crie o primeiro para aparecer em /movimentos/editorial.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title={formData.id ? 'Editar Artigo' : 'Novo Artigo Editorial'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Título</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Slug (URL)</label>
                <input required type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" placeholder="ex: samba-e-resistencia" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Resumo (excerpt)</label>
                <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#FF4D00] resize-none" placeholder="Frase curta para listagens e cards..." />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Frase de destaque (opcional)</label>
                <input type="text" name="editorial_phrase" value={formData.editorial_phrase} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" name="active" checked={formData.active} onChange={handleChange} className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#FF4D00]" />
                <label htmlFor="active" className="text-sm text-white/70">Artigo ativo e visível na loja</label>
              </div>
            </div>

            <div className="space-y-4">
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
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Corpo do artigo</label>
            <p className="text-xs text-white/40 mb-2">Separe parágrafos com uma linha em branco.</p>
            <textarea name="body" value={formData.body} onChange={handleChange} rows={12} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] resize-y font-mono text-sm" placeholder="Primeiro parágrafo do manifesto editorial...&#10;&#10;Segundo parágrafo..." />
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
              Salvar Artigo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

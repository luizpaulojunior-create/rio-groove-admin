import React, { useState, useEffect } from 'react';
import { Upload, Save, Plus, Edit2, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { storageService } from '../services/storage';
import { STORAGE_PATHS } from '../config/storage';
import { fetchArtists, saveArtist, deleteArtist } from '../services/storefrontCms';
import Modal from '../components/Modal';

const MAX_PORTFOLIO = 6;

const emptyForm = {
  id: null,
  name: '',
  slug: '',
  bio: '',
  cover_image_url: '',
  instagram_url: '',
  video_url: '',
  portfolio_images: [],
  sort_order: 0,
  active: true,
};

export default function Artists() {
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [coverFile, setCoverFile] = useState(null);
  const [portfolioFiles, setPortfolioFiles] = useState([]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setTableMissing(false);
      const data = await fetchArtists();
      setArtists(data);
    } catch (err) {
      console.error(err);
      if (err.code === 'ARTISTS_TABLE_MISSING') {
        setTableMissing(true);
        toast.error('Tabela artists ausente. Execute 11_movimentos_cms.sql.');
      } else {
        toast.error('Erro ao carregar artistas.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleEdit = (artist) => {
    setFormData({
      id: artist.id,
      name: artist.name || '',
      slug: artist.slug || '',
      bio: artist.bio || '',
      cover_image_url: artist.cover_image_url || '',
      instagram_url: artist.instagram_url || '',
      video_url: artist.video_url || '',
      portfolio_images: Array.isArray(artist.portfolio_images) ? artist.portfolio_images : [],
      sort_order: artist.sort_order ?? 0,
      active: artist.active !== false,
    });
    setCoverFile(null);
    setPortfolioFiles([]);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData(emptyForm);
    setCoverFile(null);
    setPortfolioFiles([]);
    setIsModalOpen(true);
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setFormData((prev) => ({ ...prev, cover_image_url: URL.createObjectURL(file) }));
    }
  };

  const handlePortfolioUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const currentCount = formData.portfolio_images.length + portfolioFiles.length;
    const allowed = files.slice(0, MAX_PORTFOLIO - currentCount);
    if (allowed.length < files.length) {
      toast.info(`Máximo de ${MAX_PORTFOLIO} fotos no portfólio.`);
    }
    setPortfolioFiles((prev) => [...prev, ...allowed]);
  };

  const removePortfolioExisting = (index) => {
    setFormData((prev) => ({
      ...prev,
      portfolio_images: prev.portfolio_images.filter((_, i) => i !== index),
    }));
  };

  const removePortfolioPending = (index) => {
    setPortfolioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      let coverUrl = formData.cover_image_url;
      if (coverFile) {
        coverUrl = await storageService.uploadFile(coverFile, STORAGE_PATHS.ARTISTS);
      }

      const portfolioUrls = [...formData.portfolio_images];
      for (const file of portfolioFiles) {
        const url = await storageService.uploadFile(file, STORAGE_PATHS.ARTISTS);
        portfolioUrls.push(url);
      }

      const payload = {
        name: formData.name,
        slug: formData.slug,
        bio: formData.bio || null,
        cover_image_url: coverUrl || null,
        instagram_url: formData.instagram_url || null,
        video_url: formData.video_url || null,
        portfolio_images: portfolioUrls.slice(0, MAX_PORTFOLIO),
        sort_order: formData.sort_order,
        active: formData.active,
      };

      await saveArtist(payload, formData.id || null);
      toast.success(formData.id ? 'Artista atualizado!' : 'Artista criado!');
      setIsModalOpen(false);
      fetchList();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar artista.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este artista?')) return;
    try {
      await deleteArtist(id);
      toast.success('Artista excluído!');
      fetchList();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir artista.');
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
          <h1 className="text-3xl font-heading tracking-widest text-white uppercase">Artistas</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Perfis em /movimentos/artistas — capa, bio, portfólio, Instagram e vídeo YouTube.
          </p>
        </div>
        {!tableMissing && (
          <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Artista
          </button>
        )}
      </div>

      {tableMissing && (
        <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/30 rounded-3xl p-6 text-white">
          <p className="text-sm">Execute <strong>supabase/11_movimentos_cms.sql</strong> no Supabase.</p>
        </div>
      )}

      <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Nome</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Slug</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Ordem</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {artists.map((artist) => (
              <tr key={artist.id} className="hover:bg-white/[0.02]">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black border border-white/10 overflow-hidden shrink-0">
                      {artist.cover_image_url ? (
                        <img src={artist.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={16} className="text-white/20" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-white">{artist.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-white/70">/movimentos/artistas/{artist.slug}</td>
                <td className="p-4 text-sm text-white/50">{artist.sort_order ?? 0}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${artist.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {artist.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(artist)} className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(artist.id)} className="p-2 text-white/50 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {artists.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-white/40">Nenhum artista cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title={formData.id ? 'Editar Artista' : 'Novo Artista'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Nome</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Slug</label>
                <input required type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows={5} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#FF4D00] resize-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Instagram (URL)</label>
                <input type="url" name="instagram_url" value={formData.instagram_url} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Vídeo YouTube (URL)</label>
                <input type="url" name="video_url" value={formData.video_url} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Ordem</label>
                  <input type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#FF4D00]" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} className="w-4 h-4 rounded" />
                    Ativo na loja
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Foto de capa</label>
                <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-black/50">
                  {formData.cover_image_url ? (
                    <img src={formData.cover_image_url} alt="Capa" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/20">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-[#FF4D00] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <Upload size={16} /> Capa
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">
                  Portfólio (até {MAX_PORTFOLIO} fotos)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.portfolio_images.map((url, i) => (
                    <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePortfolioExisting(i)} className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white/80 hover:text-red-400">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {portfolioFiles.map((file, i) => (
                    <div key={`pending-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-[#FF4D00]/30">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover opacity-80" />
                      <button type="button" onClick={() => removePortfolioPending(i)} className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white/80 hover:text-red-400">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {formData.portfolio_images.length + portfolioFiles.length < MAX_PORTFOLIO && (
                    <label className="aspect-square rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF4D00]/50 text-white/40 hover:text-white/70">
                      <Upload size={20} />
                      <span className="text-[10px] mt-1">Adicionar</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolioUpload} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
              Salvar Artista
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

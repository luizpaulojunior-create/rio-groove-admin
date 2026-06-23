import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Tag, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

import { storageService } from '../services/storage';
import { STORAGE_PATHS } from '../config/storage';
import { collectionsService } from '../services/collections';
import Modal from '../components/Modal';

function getCampaignBanner(campaign) {
  return campaign?.banner_url || campaign?.banner || campaign?.image_url || null;
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function formatCampaignSaveError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  if (message.includes('failed to fetch') || message.includes('network') || error?.name === 'StorageUnknownError') {
    return 'Falha de conexão ao enviar o banner. Verifique sua internet, desative VPN/adblock e tente de novo.';
  }
  return error?.message || 'Erro ao salvar campanha.';
}

function getCampaignScheduleLabel(campaign) {
  const now = new Date();
  if (!campaign.active) return 'Inativa';
  if (campaign.start_date && new Date(campaign.start_date) > now) {
    return `Agendada (${new Date(campaign.start_date).toLocaleDateString('pt-BR')})`;
  }
  if (campaign.end_date && new Date(campaign.end_date) < now) return 'Encerrada';
  return 'Ativa';
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [pendingBannerUrl, setPendingBannerUrl] = useState(null);
  const [collections, setCollections] = useState([]);

  const fetchCampaigns = async (showLoading = true) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela campaigns não existe. Execute o SQL primeiro.');
          toast.error('Tabela campaigns não encontrada no Supabase.');
          setCampaigns([]);
        } else {
          throw error;
        }
      } else {
        setCampaigns(data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns(false);
    collectionsService.getCollections()
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch(() => setCollections([]));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.target);
    const collectionId = formData.get('collection_id');
    const showAsPopup = formData.get('show_as_popup') === 'on';

    if (showAsPopup && !collectionId) {
      toast.error('Popup na home exige uma coleção vinculada (ex.: Copa Rio Groove).');
      return;
    }

    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      type: formData.get('type') || 'seasonal',
      collection_id: collectionId || null,
      coupon_code: formData.get('coupon_code') || null,
      start_date: formData.get('start_date') || null,
      end_date: formData.get('end_date') || null,
      active: formData.get('active') === 'on',
      show_as_popup: formData.get('show_as_popup') === 'on',
    };

    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Salvando campanha...');

      if (bannerFile) {
        const uploadedUrl = await storageService.uploadFile(bannerFile, STORAGE_PATHS.CAMPAIGNS);
        data.banner_url = uploadedUrl;
        setPendingBannerUrl(uploadedUrl);
        setBannerFile(null);
        setBannerPreview(uploadedUrl);
      } else if (pendingBannerUrl) {
        data.banner_url = pendingBannerUrl;
      } else if (isHttpUrl(bannerPreview)) {
        data.banner_url = bannerPreview;
      } else if (editingCampaign) {
        const existingBanner = getCampaignBanner(editingCampaign);
        if (existingBanner) data.banner_url = existingBanner;
      }

      if (editingCampaign) {
        const response = await supabase
          .from('campaigns')
          .update(data)
          .eq('id', editingCampaign.id)
          .select();
        if (response.error) throw response.error;
      } else {
        const response = await supabase
          .from('campaigns')
          .insert([data])
          .select();
        if (response.error) throw response.error;
      }

      toast.update(loadingToast, { render: 'Campanha salva com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
      setPendingBannerUrl(null);
      setIsModalOpen(false);
      fetchCampaigns(false);
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      toast.dismiss();
      toast.error(formatCampaignSaveError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setBannerFile(null);
    setPendingBannerUrl(getCampaignBanner(campaign));
    setBannerPreview(getCampaignBanner(campaign));
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCampaign(null);
    setBannerFile(null);
    setPendingBannerUrl(null);
    setBannerPreview(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status atualizado');
      fetchCampaigns(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-64 bg-white/10 animate-pulse rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-heading tracking-widest text-white uppercase">
            Campanhas & Drops
          </h1>
          <p className="text-[var(--color-text-muted)] font-sans mt-2">
            Gerencie promoções, coleções exclusivas e ações de vendas
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2 px-6 py-3">
          <Plus size={20} />
          <span>Nova Campanha</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-[#0D0D0D] border border-white/5 rounded-3xl overflow-hidden group hover:border-[#FF4D00]/30 transition-all flex flex-col">
            <div className="h-32 bg-white/5 relative flex items-center justify-center overflow-hidden">
              {getCampaignBanner(campaign) ? (
                <img src={getCampaignBanner(campaign)} alt={campaign.title} className="w-full h-full object-cover" />
              ) : (
                <Play className="text-white/20 w-12 h-12" />
              )}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                getCampaignScheduleLabel(campaign) === 'Ativa'
                  ? 'bg-green-500/20 text-green-500'
                  : getCampaignScheduleLabel(campaign).startsWith('Agendada')
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-white/10 text-white/50'
              }`}>
                {getCampaignScheduleLabel(campaign)}
              </div>
              {campaign.show_as_popup && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF4D00]/20 text-[#FF4D00]">
                  Popup home
                </div>
              )}
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-2xl font-heading text-white mb-4">{campaign.title}</h3>
              
              <div className="space-y-3 mb-6 flex-1 font-sans text-sm">
                <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                  <Calendar size={16} className="text-purple-500" />
                  <span>
                    {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('pt-BR') : 'Sem data definida'}
                  </span>
                </div>
                {campaign.coupon_code && (
                  <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                    <Tag size={16} className="text-[#FF4D00]" />
                    <span className="uppercase font-bold text-white/80">{campaign.coupon_code}</span>
                  </div>
                )}
                {campaign.collection_id && (
                  <div className="text-[var(--color-text-muted)]">
                    Coleção: {collections.find((c) => c.id === campaign.collection_id)?.name || 'Vinculada'}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                <button 
                  onClick={() => toggleStatus(campaign.id, campaign.active)}
                  className={`flex-1 h-10 rounded-xl font-medium text-sm transition-colors ${campaign.active ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 text-[#FF4D00]'}`}
                >
                  {campaign.active ? 'Pausar' : 'Ativar'}
                </button>
                <button 
                  onClick={() => handleEdit(campaign)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="col-span-full text-center py-12 bg-[#0D0D0D] border border-white/5 rounded-2xl">
            <p className="text-[var(--color-text-muted)]">Nenhuma campanha cadastrada.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingCampaign ? "Editar Campanha" : "Nova Campanha"}
        maxWidth="max-w-2xl"
      >
        <form className="space-y-6" onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Título da Campanha</label>
              <input name="title" defaultValue={editingCampaign?.title} required className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Slug</label>
              <input name="slug" defaultValue={editingCampaign?.slug} required className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Tipo</label>
              <select
                name="type"
                defaultValue={editingCampaign?.type || 'seasonal'}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              >
                <option value="seasonal">Coleção Sazonal</option>
                <option value="drop">Novo Drop</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Coleção vinculada</label>
              <select
                name="collection_id"
                defaultValue={editingCampaign?.collection_id || ''}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              >
                <option value="">— Nenhuma (produtos por tag) —</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name} ({collection.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Descrição (subtítulo do card)</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editingCampaign?.description || editingCampaign?.subtitle || ''}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 resize-none"
              placeholder="Texto curto exibido no card da home"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Data de Início</label>
              <input type="datetime-local" name="start_date" defaultValue={editingCampaign?.start_date ? new Date(editingCampaign.start_date).toISOString().slice(0, 16) : ''} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Data de Término</label>
              <input type="datetime-local" name="end_date" defaultValue={editingCampaign?.end_date ? new Date(editingCampaign.end_date).toISOString().slice(0, 16) : ''} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Código do Cupom</label>
            <input name="coupon_code" defaultValue={editingCampaign?.coupon_code} className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 uppercase" placeholder="Ex: PROMO20" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Banner da Campanha</label>
            <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/1] bg-black/50">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-white/20">
                  <Play size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#e64500]">
                  Escolher Imagem
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isSubmitting} />
                </label>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm text-[var(--color-text-muted)]">
            <p className="text-white/80 mb-1">Lançamento programado</p>
            <p>Use <strong className="text-white/90">Data de Início</strong> para o card aparecer automaticamente na home. Mantenha a coleção vinculada com status <strong className="text-white/90">Ativa</strong> no dia do lançamento. Campanhas inativas, sem banner ou com coleção inexistente ficam ocultas na loja.</p>
            <p className="mt-3">
              Marque <strong className="text-white/90">Popup na home</strong> para abrir um banner modal ao entrar na página inicial (ideal para coleções sazonais como Copa Rio Groove).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="show_as_popup" id="show_as_popup" defaultChecked={Boolean(editingCampaign?.show_as_popup)} className="w-5 h-5 rounded border-white/10 bg-transparent text-[#FF4D00] focus:ring-0 focus:ring-offset-0" />
            <label htmlFor="show_as_popup" className="text-white">Popup na home (modal ao abrir a loja)</label>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" name="active" id="active" defaultChecked={editingCampaign ? editingCampaign.active : true} className="w-5 h-5 rounded border-white/10 bg-transparent text-[#FF4D00] focus:ring-0 focus:ring-offset-0" />
            <label htmlFor="active" className="text-white">Campanha Ativa</label>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-[var(--color-border)] mt-8">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Salvando...' : 'Salvar Campanha'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

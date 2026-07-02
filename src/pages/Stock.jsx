import { useState, useEffect, useMemo } from 'react';
import Modal from '../components/Modal';
import { stockService } from '../services/stock';
import { toast } from 'react-toastify';
import { Search, Plus, Edit, Trash2, ArrowRightLeft, Package, Copy, Check, FilterX, AlertTriangle, XCircle, CheckCircle2, Power, Eye } from 'lucide-react';
import {
  CATEGORIES, STOCK_FILTER_CATEGORIES, GENDERS, FABRICS, COLORS, generateSKU,
  categoryUsesGender, categoryUsesFabric, categoryUsesMaterial, categoryAllowsManualCreate,
  getModelsForCategory, getColorsForCategory, getSizesForCategory, getMaterialsForCategory,
  getAllModelsForFilters, resolveGenderFromModel, normalizeCategory,
  GENDER_NEUTRAL, FABRIC_NEUTRAL, MATERIAL_CANECA
} from '../config/inventory';

const getGenderFromModel = (model, storedGender) => resolveGenderFromModel(model, storedGender);

const getFabricFromSKU = (sku) => {
  if (!sku) return 'Lisa';
  const parts = sku.split('-');
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    if (lastPart === 'EST') return 'Estonada';
    if (lastPart === 'LS') return 'Lisa';
    // legacy check
    if (parts[0].endsWith('E')) return 'Estonada';
  }
  return 'Lisa';
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Stock() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterFabric, setFilterFabric] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterActive, setFilterActive] = useState('true');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Form State
  const [formCategory, setFormCategory] = useState('');
  const [formGender, setFormGender] = useState('Masculino');
  const [formModel, setFormModel] = useState('');
  const [formFabric, setFormFabric] = useState('Lisa');
  const [formColor, setFormColor] = useState('');
  const [formSize, setFormSize] = useState('M');

  const formModels = useMemo(
    () => getModelsForCategory(formCategory, formGender),
    [formCategory, formGender]
  );

  const formColors = useMemo(
    () => getColorsForCategory(formCategory),
    [formCategory]
  );

  const formSizes = useMemo(
    () => getSizesForCategory(formCategory),
    [formCategory]
  );

  const applyCategoryDefaults = (newCat) => {
    setFormCategory(newCat);
    const sizes = getSizesForCategory(newCat);
    setFormSize(sizes[0] || 'M');
    const colors = getColorsForCategory(newCat);
    setFormColor(colors[0]?.label || COLORS[0].label);
    if (categoryUsesGender(newCat)) {
      const g = formGender || GENDERS[0];
      setFormGender(g);
      const models = getModelsForCategory(newCat, g);
      setFormModel(models[0] || '');
    } else {
      const models = getModelsForCategory(newCat, null);
      setFormModel(models[0] || '');
    }
    if (!categoryUsesFabric(newCat)) {
      setFormFabric('Lisa');
    }
  };
  const formSku = useMemo(() => {
    if (editingItem) return editingItem.sku || '';
    const colorObj = formColors.find(c => c.label === formColor) || COLORS.find(c => c.label === formColor);
    const colorKey = colorObj ? colorObj.key : '';
    const genderArg = categoryUsesGender(formCategory) ? formGender : null;
    const fabricArg = categoryUsesFabric(formCategory) ? formFabric : null;
    return generateSKU(formCategory, formModel, colorKey, formSize, fabricArg, genderArg);
  }, [formCategory, formModel, formColor, formSize, formFabric, formGender, formColors, editingItem]);

  const [copiedSku, setCopiedSku] = useState(null);

  useEffect(() => {
    fetchStock(false);
  }, []);

  const fetchStock = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await stockService.getStock();
      setStockItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      toast.error('Erro ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterCategory('');
    setFilterGender('');
    setFilterFabric('');
    setFilterColor('');
    setFilterModel('');
    setFilterActive('');
  };

  const handleCopySku = (sku) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const availableModels = useMemo(() => getAllModelsForFilters(), []);

  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
      const itemGender = getGenderFromModel(item.model, item.gender);
      const itemFabric = getFabricFromSKU(item.sku);
      const itemStatus = Number(item.quantity) === 0 ? 'ESGOTADO' : (Number(item.quantity) <= Number(item.min_stock) ? 'BAIXO' : 'DISPONÍVEL');
      const isActive = item.is_active !== false;
      
      if (filterCategory && normalizeCategory(item.category) !== filterCategory) return false;
      if (filterStatus && itemStatus !== filterStatus) return false;
      if (filterGender && itemGender !== filterGender) return false;
      if (filterFabric && itemFabric !== filterFabric) return false;
      if (filterColor && item.color_label !== filterColor) return false;
      if (filterModel && item.model !== filterModel) return false;
      if (filterActive !== '') {
        if (filterActive === 'true' && !isActive) return false;
        if (filterActive === 'false' && isActive) return false;
      }
      
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.toLowerCase();
        const match = (
          (item.sku && item.sku.toLowerCase().includes(term)) ||
          (item.model && item.model.toLowerCase().includes(term))
        );
        if (!match) return false;
      }
      
      return true;
    });
  }, [stockItems, filterCategory, filterStatus, filterGender, filterFabric, filterColor, filterModel, filterActive, debouncedSearchTerm]);

  const totalItems = stockItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const totalSkus = stockItems.length;
  const lowStockCount = stockItems.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.min_stock)).length;
  const outOfStockCount = stockItems.filter(i => Number(i.quantity) === 0).length;
  const totalValue = stockItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unit_cost || 0)), 0);

  const handleSeed = async () => {
    if (isProcessing) return;
    if (!window.confirm('Popular estoque base com toda a grade operacional (idempotente — não duplica itens existentes)?')) {
      return;
    }
    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Gerando grade operacional base...');
      const response = await stockService.seedStockItems();
      toast.update(loadingToast, { render: response.message, type: 'success', isLoading: false, autoClose: 6000 });
      fetchStock(false);
    } catch (error) {
      console.error('Erro ao gerar estoque:', error);
      toast.dismiss();
      toast.error(error?.response?.data?.error || error.message || 'Erro ao gerar estoque inicial.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveYellow = async () => {
    if (isProcessing) return;
    if (!window.confirm('Remover todos os SKUs amarelos do estoque? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Removendo estoque amarelo...');
      const response = await stockService.removeYellowStockItems();
      toast.update(loadingToast, { render: response.message, type: 'success', isLoading: false, autoClose: 6000 });
      fetchStock(false);
    } catch (error) {
      console.error('Erro ao remover amarelo:', error);
      toast.dismiss();
      toast.error(error?.response?.data?.error || error.message || 'Erro ao remover estoque amarelo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    applyCategoryDefaults(CATEGORIES[0]);
    setFormFabric(FABRICS[0]);
    setIsModalOpen(true);
  };

  const handleEditInit = (item) => {
    setEditingItem(item);
    const cat = normalizeCategory(item.category || CATEGORIES[0]);
    setFormCategory(cat);
    setFormModel(item.model || '');
    setFormColor(item.color_label || COLORS[0].label);
    setFormSize(item.size || 'M');
    setFormGender(getGenderFromModel(item.model, item.gender) || GENDERS[0]);
    setFormFabric(item.fabric || getFabricFromSKU(item.sku) || FABRICS[0]);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (item) => {
    if (isProcessing) return;
    const action = item.is_active !== false ? 'desativar' : 'ativar';
    if (window.confirm(`Tem certeza que deseja ${action} o SKU ${item.sku}?`)) {
      try {
        setIsProcessing(true);
        const loadingToast = toast.loading(`${action.charAt(0).toUpperCase() + action.slice(1)}ndo item...`);
        await stockService.updateStockItem(item.id, { is_active: item.is_active === false });
        toast.update(loadingToast, { render: `Item ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`, type: 'success', isLoading: false, autoClose: 3000 });
        fetchStock(false);
      } catch (error) {
        console.error(`Erro ao ${action} item do estoque:`, error);
        toast.dismiss();
        toast.error(`Erro ao ${action} item.`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDelete = async (item) => {
    if (isProcessing) return;
    if (window.confirm(`Tem certeza que deseja excluir DE VEZ o estoque do SKU ${item.sku}? Esta ação é irreversível.`)) {
      try {
        setIsProcessing(true);
        const loadingToast = toast.loading('Excluindo item...');
        await stockService.deleteStockItem(item.id);
        toast.update(loadingToast, { render: 'Item excluído com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
        fetchStock(false);
      } catch (error) {
        console.error('Erro ao excluir item do estoque:', error);
        toast.dismiss();
        toast.error('Erro ao excluir item.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAdjust = (item) => {
    setAdjustingItem(item);
    setIsAdjustModalOpen(true);
  };

  const submitAdjust = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    
    const formData = new FormData(e.target);
    const adjustType = formData.get('adjustType');
    const amount = Number(formData.get('amount'));
    const reason = formData.get('reason');

    let finalQuantity = adjustingItem.quantity;
    if (adjustType === 'in') finalQuantity += amount;
    else if (adjustType === 'out') finalQuantity -= amount;
    else if (adjustType === 'set') finalQuantity = amount;

    if (finalQuantity < 0) {
      toast.error("Erro: O estoque não pode ficar negativo.");
      return;
    }

    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Ajustando estoque...');
      await stockService.adjustStock(adjustingItem.id, adjustType === 'set' ? amount - adjustingItem.quantity : (adjustType === 'in' ? amount : -amount), reason);
      toast.update(loadingToast, { render: 'Estoque ajustado com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
      setIsAdjustModalOpen(false);
      fetchStock(false);
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      toast.dismiss();
      toast.error('Erro ao ajustar estoque. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    
    const formData = new FormData(e.target);
    
    const category = editingItem ? editingItem.category : formData.get('category')?.trim();
    const model = editingItem ? editingItem.model : formData.get('model')?.trim();
    const color_key = formData.get('color_key')?.trim().toLowerCase();
    const color_label = editingItem ? editingItem.color_label : formData.get('color_label')?.trim();
    const color_hex = formData.get('color_hex')?.trim();
    const size = editingItem ? editingItem.size : formData.get('size');
    const sku = formData.get('sku')?.trim().toUpperCase();
    const quantity = Number(formData.get('stock'));
    const min_stock = Number(formData.get('min_stock'));
    const unit_cost = Number(formData.get('cost'));
    const is_active = formData.get('active') === 'on';
    
    if (quantity < 0) {
      toast.error("Erro: O estoque não pode ser negativo.");
      return;
    }
    if (min_stock < 0) {
      toast.error("Erro: O estoque mínimo não pode ser negativo.");
      return;
    }
    if (unit_cost < 0) {
      toast.error("Erro: O custo unitário não pode ser negativo.");
      return;
    }

    const cat = normalizeCategory(category);

    if (!editingItem && !categoryAllowsManualCreate(cat)) {
      toast.error('Acessório ainda não possui grade operacional automática.');
      return;
    }

    const data = {
      category: cat,
      gender: categoryUsesGender(cat) ? (editingItem?.gender || formGender) : GENDER_NEUTRAL,
      fabric: categoryUsesFabric(cat) ? (editingItem?.fabric || formFabric) : FABRIC_NEUTRAL,
      model,
      color_key,
      color_label,
      color_hex,
      size,
      sku,
      quantity,
      min_stock,
      unit_cost,
      is_active
    };

    console.log('[DEBUG] Stock.jsx handleSave payload enviado:', data);

    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Salvando lote de estoque...');
      
      let savedItem;
      if (editingItem) {
        savedItem = await stockService.updateStockItem(editingItem.id, data);
      } else {
        savedItem = await stockService.createStockItem(data);
      }

      const itemId = editingItem ? editingItem.id : savedItem.id;

      toast.update(loadingToast, { render: 'Lote de estoque salvo com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
      setIsModalOpen(false);
      fetchStock(false);
      } catch (error) {
        console.error('[DEBUG] Stock.jsx catch error response:', error?.response?.data);
        console.error('[DEBUG] Stock.jsx catch error real:', error);
        toast.dismiss();
        toast.error(error?.response?.data?.error || error.message || 'Erro ao salvar lote de estoque.');
      } finally {
        setIsProcessing(false);
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-screen overflow-hidden bg-[#050505]">
      {/* Header & Top Bar - Fixed */}
      <div className="flex-none px-4 md:px-6 py-4 border-b border-[#1a1a1a] bg-[#0A0A0A] z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Package className="text-blue-500" size={24} />
              Inventory Operations
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Centro operacional de estoque e reposição em tempo real</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleRemoveYellow}
              disabled={isProcessing}
              className="flex-1 md:flex-none px-3 h-8 bg-[#111] border border-yellow-500/30 rounded text-xs font-medium text-yellow-400 hover:text-yellow-300 hover:bg-[#1a1a1a] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Package size={14} />
              <span>Remover Amarelo</span>
            </button>
            <button
              onClick={handleSeed}
              disabled={isProcessing}
              className="flex-1 md:flex-none px-3 h-8 bg-[#111] border border-[#222] rounded text-xs font-medium text-[var(--color-text-muted)] hover:text-white hover:bg-[#1a1a1a] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Package size={14} />
              <span>Popular Estoque Base</span>
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 md:flex-none px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(37,99,235,0.2)]"
            >
              <Plus size={14} />
              <span>Nova Entrada</span>
            </button>
          </div>
        </div>

        {/* Operational Top Cards - Compact & High Density */}
        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
          <div className="min-w-[140px] flex-1 bg-[#111] border border-[#222] rounded-md p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Peças Total</span>
            <span className="text-xl font-mono text-white leading-none mt-1.5">{totalItems}</span>
          </div>
          <div className="min-w-[140px] flex-1 bg-[#111] border border-[#222] rounded-md p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Total SKUs</span>
            <span className="text-xl font-mono text-white leading-none mt-1.5">{totalSkus}</span>
          </div>
          <div className="min-w-[140px] flex-1 bg-red-950/20 border border-red-900/30 rounded-md p-2.5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider pl-1.5">Esgotados</span>
            <span className="text-xl font-mono text-red-500 leading-none mt-1.5 pl-1.5">{outOfStockCount}</span>
          </div>
          <div className="min-w-[140px] flex-1 bg-yellow-950/20 border border-yellow-900/30 rounded-md p-2.5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider pl-1.5">Baixo Estoque</span>
            <span className="text-xl font-mono text-yellow-500 leading-none mt-1.5 pl-1.5">{lowStockCount}</span>
          </div>
          <div className="min-w-[140px] flex-1 bg-[#111] border border-[#222] rounded-md p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Capital Alocado</span>
            <span className="text-xl font-mono text-green-400 leading-none mt-1.5">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky Filters Bar */}
        <div className="flex-none px-4 md:px-6 py-2.5 bg-[#0A0A0A] border-b border-[#222] z-10 flex gap-2 overflow-x-auto hide-scrollbar">
          <div className="relative min-w-[200px] flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" size={14} />
            <input
              type="text"
              placeholder="Buscar SKU ou Modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-[#222] rounded px-8 h-8 text-xs text-white focus:outline-none focus:border-[#444] transition-colors"
            />
          </div>
          
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#111] border border-[#222] rounded px-2.5 h-8 text-xs text-[#aaa] hover:text-white focus:outline-none focus:border-[#444] appearance-none min-w-[110px] cursor-pointer">
            <option value="">Status: Todos</option>
            <option value="DISPONÍVEL">Disponível</option>
            <option value="BAIXO">Estoque Baixo</option>
            <option value="ESGOTADO">Esgotado</option>
          </select>
          
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-[#111] border border-[#222] rounded px-2.5 h-8 text-xs text-[#aaa] hover:text-white focus:outline-none focus:border-[#444] appearance-none min-w-[110px] cursor-pointer">
            <option value="">Cat: Todas</option>
            {STOCK_FILTER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="bg-[#111] border border-[#222] rounded px-2.5 h-8 text-xs text-[#aaa] hover:text-white focus:outline-none focus:border-[#444] appearance-none min-w-[110px] cursor-pointer">
            <option value="">Gên: Todos</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select value={filterFabric} onChange={e => setFilterFabric(e.target.value)} className="bg-[#111] border border-[#222] rounded px-2.5 h-8 text-xs text-[#aaa] hover:text-white focus:outline-none focus:border-[#444] appearance-none min-w-[110px] cursor-pointer">
            <option value="">Malha: Todas</option>
            {FABRICS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <select value={filterColor} onChange={e => setFilterColor(e.target.value)} className="bg-[#111] border border-[#222] rounded px-2.5 h-8 text-xs text-[#aaa] hover:text-white focus:outline-none focus:border-[#444] appearance-none min-w-[110px] cursor-pointer">
            <option value="">Cor: Todas</option>
            {COLORS.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
          </select>

          <select value={filterModel} onChange={e => setFilterModel(e.target.value)} className="bg-[#111] border border-[#222] rounded px-2.5 h-8 text-xs text-[#aaa] hover:text-white focus:outline-none focus:border-[#444] appearance-none min-w-[110px] cursor-pointer">
            <option value="">Modelo: Todos</option>
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="bg-[#111] border border-[#222] rounded px-2.5 h-8 text-xs text-[#aaa] hover:text-white focus:outline-none focus:border-[#444] appearance-none min-w-[110px] cursor-pointer">
            <option value="">Status: Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>

          {(searchTerm || filterStatus || filterCategory || filterGender || filterFabric || filterColor || filterModel || filterActive) && (
            <button onClick={clearFilters} title="Limpar Filtros" className="px-2.5 h-8 flex items-center justify-center text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 rounded transition-colors flex-shrink-0">
              <FilterX size={14} />
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto bg-[#050505] p-0 md:p-4 custom-scrollbar">
          
          {/* Desktop Table */}
          <div className="hidden md:block bg-[#0A0A0A] border border-[#1a1a1a] rounded-lg overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
              <thead className="bg-[#111] border-b border-[#222]">
                <tr>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#666] uppercase tracking-wider">SKU</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#666] uppercase tracking-wider">Produto</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#666] uppercase tracking-wider">Cor</th>
                  <th className="py-3 px-4 text-center text-[10px] font-bold text-[#666] uppercase tracking-wider">Tam</th>
                  <th className="py-3 px-4 text-center text-[10px] font-bold text-[#666] uppercase tracking-wider w-[100px]">Estoque</th>
                  <th className="py-3 px-4 text-center text-[10px] font-bold text-[#666] uppercase tracking-wider w-[120px]">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#666] uppercase tracking-wider text-right">Custo</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#666] uppercase tracking-wider text-center">Atualização</th>
                  <th className="py-3 px-4 w-[160px] text-right text-[10px] font-bold text-[#666] uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-[#555]">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-medium uppercase tracking-wider">Sincronizando inventário...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-[#555] text-sm">
                      Nenhum registro operacional encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(row => {
                    const status = Number(row.quantity) === 0 ? 'ESGOTADO' : (Number(row.quantity) <= Number(row.min_stock) ? 'BAIXO' : 'DISPONÍVEL');
                    const isOut = status === 'ESGOTADO';
                    const isLow = status === 'BAIXO';
                    const isAvail = status === 'DISPONÍVEL';
                    const isActive = row.is_active !== false;
                    
                    return (
                      <tr key={row.id} className={`group hover:bg-[#111] transition-colors ${!isActive ? 'opacity-60' : ''}`}>
                        
                        {/* SKU */}
                        <td className="py-2.5 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-[13px] font-bold tracking-wide ${isActive ? 'text-white' : 'text-[#666] line-through'}`}>{row.sku}</span>
                            <button onClick={() => handleCopySku(row.sku)} className="text-[#444] hover:text-white transition-colors p-0.5">
                              {copiedSku === row.sku ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
                            </button>
                          </div>
                        </td>

                        {/* Produto */}
                        <td className="py-2.5 px-4 align-middle">
                          <div className="flex flex-col justify-center">
                            <span className="text-[12px] font-medium text-[#ddd]">{row.model}</span>
                            <span className="text-[10px] text-[#777] mt-0.5">{normalizeCategory(row.category)} • {getGenderFromModel(row.model)}</span>
                          </div>
                        </td>

                        {/* Cor */}
                        <td className="py-2.5 px-4 align-middle">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#aaa]">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm border border-[#333]" style={{ backgroundColor: row.color_hex || '#ccc' }}></div>
                            <span className="text-white font-medium">{row.color_label}</span>
                          </div>
                        </td>

                        {/* Tam */}
                        <td className="py-2.5 px-4 align-middle text-center">
                          <span className="font-bold text-white px-2 py-0.5 bg-[#222] rounded text-[11px] border border-[#333]">{row.size}</span>
                        </td>

                        {/* Estoque (Must be the strongest visual info) */}
                        <td className="py-2.5 px-4 align-middle text-center">
                          <div className={`flex flex-col items-center justify-center py-1 rounded ${isOut ? 'bg-red-500/10' : isLow ? 'bg-yellow-500/10' : 'bg-green-500/5'}`}>
                            <span className={`text-xl font-mono font-bold leading-none ${
                              isOut ? 'text-red-500' : 
                              isLow ? 'text-yellow-500' : 
                              'text-green-400'
                            }`}>{row.quantity}</span>
                            <span className="text-[9px] text-[#666] mt-1 uppercase tracking-wider font-semibold">Mín {row.min_stock}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-4 align-middle">
                          <div className="flex justify-center">
                            {isOut && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/30"><XCircle size={12}/> ESGOTADO</span>}
                            {isLow && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"><AlertTriangle size={12}/> BAIXO</span>}
                            {isAvail && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 size={12}/> DISPONÍVEL</span>}
                          </div>
                        </td>

                        {/* Custo */}
                        <td className="py-2.5 px-4 align-middle text-right text-[12px] text-[#888] font-mono font-medium">
                          {Number(row.unit_cost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>

                        {/* Atualização */}
                        <td className="py-2.5 px-4 align-middle text-center text-[10px] text-[#666] font-mono">
                          {new Date(row.updatedAt || new Date()).toLocaleDateString('pt-BR')}
                          <br/>
                          <span className="opacity-50">{new Date(row.updatedAt || new Date()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>

                        {/* Ações */}
                        <td className="py-2.5 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {}}
                              className="p-1.5 bg-[#1a1a1a] hover:bg-[#333] border border-[#222] text-[#aaa] hover:text-white rounded transition-colors"
                              title="Visualizar"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => handleAdjust(row)}
                              className="px-2 py-1.5 bg-[#1a1a1a] hover:bg-blue-600 hover:text-white border border-[#222] text-[#aaa] rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                              title="Ajustar Estoque"
                            >
                              <ArrowRightLeft size={12} />
                              Ajustar
                            </button>
                            <button
                              onClick={() => handleEditInit(row)}
                              className="p-1.5 bg-[#1a1a1a] hover:bg-[#333] border border-[#222] text-[#aaa] hover:text-white rounded transition-colors"
                              title="Editar"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(row)}
                              className={`p-1.5 border rounded transition-colors ${isActive ? 'bg-[#1a1a1a] hover:bg-red-900 border-[#222] hover:border-red-900 hover:text-red-200 text-[#aaa]' : 'bg-green-900/30 hover:bg-green-900 border-green-900 hover:text-green-200 text-green-500'}`}
                              title={isActive ? "Desativar" : "Ativar"}
                            >
                              {isActive ? <Power size={12} /> : <Check size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col gap-3 p-4">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-[#555] font-medium uppercase tracking-wider">Sincronizando...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-[#555] text-sm">
                Nenhum registro encontrado.
              </div>
            ) : (
              filteredItems.map(row => {
                const status = Number(row.quantity) === 0 ? 'ESGOTADO' : (Number(row.quantity) <= Number(row.min_stock) ? 'BAIXO' : 'DISPONÍVEL');
                const isOut = status === 'ESGOTADO';
                const isLow = status === 'BAIXO';
                const isAvail = status === 'DISPONÍVEL';
                const isActive = row.is_active !== false;
                
                return (
                  <div key={row.id} className={`bg-[#0A0A0A] border border-[#222] rounded-lg p-3 flex flex-col gap-3 relative overflow-hidden shadow-lg ${!isActive ? 'opacity-60' : ''}`}>
                    {isOut && isActive && <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"></div>}
                    {isLow && isActive && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.3)]"></div>}
                    {isAvail && isActive && <div className="absolute top-0 left-0 w-1 h-full bg-green-500 opacity-30"></div>}
                    {!isActive && <div className="absolute top-0 left-0 w-1 h-full bg-gray-500 opacity-30"></div>}
                    
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-sm font-bold text-white">{row.sku}</span>
                          </div>
                          <div className="text-[11px] text-[#888] line-clamp-1">{row.model}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-2xl font-mono font-bold leading-none ${isOut ? 'text-red-500' : isLow ? 'text-yellow-500' : 'text-white'}`}>
                          {row.quantity}
                        </span>
                        <span className="text-[9px] text-[#666] mt-1 uppercase tracking-wider font-semibold">Mín {row.min_stock}</span>
                      </div>
                    </div>
                    
                    <div className="bg-[#111] rounded p-2 flex flex-wrap items-center gap-1.5 text-[10px] text-[#aaa]">
                      <div className="w-2 h-2 rounded-full border border-[#333]" style={{ backgroundColor: row.color_hex || '#ccc' }}></div>
                      <span className="text-[#ddd]">{row.color_label}</span>
                      <span className="text-[#444]">•</span>
                      <span className="font-bold text-white">{row.size}</span>
                      <span className="text-[#444]">•</span>
                      <span>{getFabricFromSKU(row.sku)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                       <div className="flex items-center gap-1">
                          {isOut && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500"><XCircle size={10}/> ESGOTADO</span>}
                          {isLow && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-yellow-500/10 text-yellow-500"><AlertTriangle size={10}/> BAIXO</span>}
                          {isAvail && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-green-500/10 text-green-500"><CheckCircle2 size={10}/> DISPONÍVEL</span>}
                       </div>
                       <div className="flex items-center gap-2">
                          <button onClick={() => handleAdjust(row)} className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ddd] rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-[#333]">
                            <ArrowRightLeft size={10} />
                            Ajustar
                          </button>
                          <button onClick={() => handleEditInit(row)} className="p-1.5 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-[#aaa] rounded">
                            <Edit size={12} />
                          </button>
                          <button onClick={() => handleToggleActive(row)} className={`p-1.5 border rounded ${isActive ? 'bg-[#1a1a1a] border-[#333] text-[#aaa]' : 'bg-green-900/30 border-green-900 text-green-500'}`}>
                            {isActive ? <Power size={12} /> : <Check size={12} />}
                          </button>
                       </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={adjustingItem ? `Ajustar Estoque: ${adjustingItem.sku}` : 'Ajustar Estoque'}
      >
        <form onSubmit={submitAdjust} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Estoque Atual: <span className="text-white font-mono text-xl">{adjustingItem?.quantity}</span>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Tipo de Ajuste</label>
              <select
                name="adjustType"
                required
                className="w-full bg-[#111] border border-[#333] rounded-lg px-4 h-10 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none text-sm"
              >
                <option value="in">Entrada Manual (+)</option>
                <option value="out">Saída Manual (-)</option>
                <option value="set">Ajuste / Contagem (=)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Quantidade</label>
              <input
                name="amount"
                type="number"
                min="0"
                required
                className="w-full bg-[#111] border border-[#333] rounded-lg px-4 h-10 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-xl"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Motivo / Observação</label>
              <input
                name="reason"
                required
                placeholder="Ex: Reposição, Descarte, Recontagem..."
                className="w-full bg-[#111] border border-[#333] rounded-lg px-4 h-10 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2 border-t border-[#333] mt-6">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 h-9 bg-transparent border border-[#333] text-white rounded-lg text-sm transition-colors hover:bg-[#1a1a1a]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isProcessing ? 'Confirmando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Lote de Estoque' : 'Adicionar Lote de Estoque'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco 1: Classificação */}
            <div className="bg-[#111] p-4 rounded-xl border border-[#222] space-y-3">
              <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Package size={12} /> Classificação Base
              </h3>
              
              <div>
                <label className="block text-[11px] font-medium text-[#aaa] mb-1">Categoria *</label>
                <select
                  name="category"
                  value={formCategory}
                  onChange={(e) => applyCategoryDefaults(e.target.value)}
                  required
                  disabled={!!editingItem}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white focus:outline-none focus:border-blue-500 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {STOCK_FILTER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {!editingItem && categoryUsesGender(formCategory) && (
                <div>
                  <label className="block text-[11px] font-medium text-[#aaa] mb-1">Gênero *</label>
                  <select
                    name="gender"
                    value={formGender}
                    onChange={(e) => {
                      const g = e.target.value;
                      setFormGender(g);
                      const models = getModelsForCategory(formCategory, g);
                      setFormModel(models[0] || '');
                    }}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-[#aaa] mb-1">Modelo *</label>
                {editingItem ? (
                  <input
                    name="model"
                    defaultValue={editingItem?.model}
                    disabled
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white opacity-50 cursor-not-allowed"
                  />
                ) : formModels.length === 0 ? (
                  <p className="text-xs text-amber-500/90 py-2">Sem grade operacional para esta categoria.</p>
                ) : (
                  <select
                    name="model"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    {formModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
              </div>

              {!editingItem && categoryUsesMaterial(formCategory) && (
                <div>
                  <label className="block text-[11px] font-medium text-[#aaa] mb-1">Material *</label>
                  <select
                    name="material"
                    value={MATERIAL_CANECA}
                    disabled
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white opacity-70 cursor-not-allowed appearance-none"
                  >
                    <option value={MATERIAL_CANECA}>{MATERIAL_CANECA}</option>
                  </select>
                </div>
              )}

              {!editingItem && categoryUsesFabric(formCategory) && (
                <div>
                  <label className="block text-[11px] font-medium text-[#aaa] mb-1">Malha *</label>
                  <select
                    name="fabric"
                    value={formFabric}
                    onChange={(e) => setFormFabric(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    {FABRICS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Bloco 2: Variação e SKU */}
            <div className="bg-[#111] p-4 rounded-xl border border-[#222] flex flex-col">
              <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Package size={12} /> Variação do Produto
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#aaa] mb-1">Cor *</label>
                  {editingItem ? (
                    <input
                      name="color_label"
                      defaultValue={editingItem?.color_label}
                      disabled
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white opacity-50 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      name="color_label"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      required
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                    >
                      {formColors.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#aaa] mb-1">Tamanho *</label>
                  {editingItem ? (
                    <input
                      name="size"
                      defaultValue={editingItem?.size}
                      disabled
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white opacity-50 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      name="size"
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-xs text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                    >
                      {formSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {!editingItem && (
                <>
                  <input type="hidden" name="color_key" value={COLORS.find(c => c.label === formColor)?.key || ''} />
                  <input type="hidden" name="color_hex" value={COLORS.find(c => c.label === formColor)?.hex || ''} />
                </>
              )}
              {editingItem && (
                <>
                  <input type="hidden" name="color_key" value={editingItem.color_key} />
                  <input type="hidden" name="color_hex" value={editingItem.color_hex} />
                </>
              )}

              <div className="mt-auto pt-4 border-t border-[#222]">
                <label className="block text-[11px] font-medium text-[#aaa] mb-1">SKU Gerado Automaticamente</label>
                <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 flex items-center opacity-80">
                  <span className="text-blue-400 font-mono font-bold text-xs tracking-wider">{editingItem ? editingItem.sku : formSku}</span>
                </div>
                <input type="hidden" name="sku" value={editingItem ? editingItem.sku : formSku} />
              </div>
            </div>

            {/* Bloco 4: Operacional */}
            <div className="bg-[#111] p-4 rounded-xl border border-[#222] md:col-span-2">
              <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ArrowRightLeft size={12} /> Controle Operacional
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#aaa] mb-1">Estoque Atual *</label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue={editingItem?.quantity ?? 0}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#aaa] mb-1">Estoque Mín. Alerta *</label>
                  <input
                    name="min_stock"
                    type="number"
                    min="0"
                    defaultValue={editingItem?.min_stock ?? 5}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#aaa] mb-1">Custo Unitário (R$) *</label>
                  <input
                    name="cost"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={editingItem?.unit_cost ?? 42.0}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 h-9 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#222]">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  defaultChecked={editingItem ? editingItem.is_active : true}
                  className="w-4 h-4 rounded border-[#333] text-blue-500 focus:ring-blue-500 bg-[#1a1a1a]"
                />
                <label htmlFor="active" className="text-[11px] font-medium text-white">Item Ativo no Sistema</label>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2 border-t border-[#333] mt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 h-9 bg-transparent border border-[#333] text-white rounded-lg text-xs font-medium transition-colors hover:bg-[#1a1a1a]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {isProcessing ? 'Salvando...' : 'Salvar Estoque'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { stockService } from '../services/stock';
import { toast } from 'react-toastify';

export default function Stock() {
  const [stockItems, setStockItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const data = await stockService.getStock();
      setStockItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      toast.error('Erro ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = stockItems.reduce((acc, item) => acc + Number(item.stock || 0), 0);
  const lowStockCount = stockItems.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.min_stock)).length;
  const outOfStockCount = stockItems.filter(i => Number(i.stock) === 0).length;

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleSeed = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Gerando estoque mestre inicial...');
      const response = await stockService.seedStockItems();
      toast.update(loadingToast, { 
        render: response.message, 
        type: 'success', 
        isLoading: false, 
        autoClose: 5000 
      });
      fetchStock();
    } catch (error) {
      console.error('Erro ao gerar estoque:', error);
      toast.dismiss();
      toast.error(error?.response?.data?.error || error.message || 'Erro ao gerar estoque inicial.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (item) => {
    if (isProcessing) return;
    if (window.confirm(`Tem certeza que deseja excluir o estoque do SKU ${item.sku}?`)) {
      try {
        setIsProcessing(true);
        const loadingToast = toast.loading('Excluindo item...');
        await stockService.deleteStockItem(item.id);
        toast.update(loadingToast, { render: 'Item excluído com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
        fetchStock();
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
    const adjustType = formData.get('adjustType'); // 'in', 'out', 'set'
    const amount = Number(formData.get('amount'));
    const reason = formData.get('reason');

    let finalQuantity = adjustingItem.stock;
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
      await stockService.adjustStock(adjustingItem.id, adjustType === 'set' ? amount - adjustingItem.stock : (adjustType === 'in' ? amount : -amount), reason);
      toast.update(loadingToast, { render: 'Estoque ajustado com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
      setIsAdjustModalOpen(false);
      fetchStock();
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
    
    const category = formData.get('category').trim();
    const model = formData.get('model').trim();
    const color_key = formData.get('color_key').trim().toLowerCase();
    const color_label = formData.get('color_label').trim();
    const color_hex = formData.get('color_hex').trim();
    const size = formData.get('size');
    const sku = formData.get('sku').trim().toUpperCase();
    const stock = Number(formData.get('stock'));
    const min_stock = Number(formData.get('min_stock'));
    const cost = Number(formData.get('cost'));
    const active = formData.get('active') === 'on';
    
    if (stock < 0) {
      toast.error("Erro: O estoque não pode ser negativo.");
      return;
    }

    const data = {
      category,
      model,
      color_key,
      color_label,
      color_hex,
      size,
      sku,
      stock,
      min_stock,
      cost,
      active
    };

    try {
      setIsProcessing(true);
      const loadingToast = toast.loading('Salvando lote de estoque...');
      if (editingItem) {
        await stockService.updateStockItem(editingItem.id, data);
      } else {
        await stockService.createStockItem(data);
      }
      toast.update(loadingToast, { render: 'Lote de estoque salvo com sucesso!', type: 'success', isLoading: false, autoClose: 3000 });
      setIsModalOpen(false);
      fetchStock();
    } catch (error) {
      console.error('Erro ao salvar item no estoque:', error);
      toast.dismiss();
      toast.error(error?.response?.data?.error || error.message || 'Erro ao salvar lote de estoque.');
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      header: 'SKU',
      accessor: 'sku',
      render: (row) => (
        <div>
          <p className="font-heading text-lg text-white">{row.sku}</p>
          <p className="text-xs text-[var(--color-text-muted)] tracking-wider uppercase">{row.model} • {row.category}</p>
        </div>
      )
    },
    {
      header: 'Cor / Tamanho',
      accessor: 'color_label',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div 
            className="w-6 h-6 rounded-full border border-[var(--color-border)] shadow-sm"
            style={{ backgroundColor: row.color_hex || '#ccc' }}
            title={row.color_label}
          />
          <div>
            <p className="font-medium text-white">{row.color_label}</p>
            <p className="text-xs text-[var(--color-text-muted)] font-heading tracking-wider">Tam: {row.size}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Estoque',
      accessor: 'stock',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-heading text-xl">{row.stock}</span>
          <span className="text-xs text-[var(--color-text-muted)]">/ {row.min_stock} min</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        let color = 'bg-green-500/10 text-green-500 border-green-500/20';
        if (row.status === 'baixo estoque') color = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        if (row.status === 'sem estoque') color = 'bg-red-500/10 text-red-500 border-red-500/20';
        if (row.status === 'inativo') color = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${color} uppercase tracking-wider`}>
            {row.status}
          </span>
        );
      }
    },
    { header: 'Custo', accessor: 'cost', render: (row) => `R$ ${Number(row.cost || 0).toFixed(2)}` },
    { header: 'Atualização', accessor: 'updatedAt', render: (row) => new Date(row.updatedAt || new Date()).toLocaleDateString('pt-BR') }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-4xl mb-1">Estoque: Itens Físicos</h1>
          <p className="text-[var(--color-text-muted)]">Gerenciamento do estoque base (tabela stock_items).</p>
        </div>
        <button
          onClick={handleSeed}
          disabled={isProcessing}
          className="btn-secondary !bg-[var(--color-surface)] flex items-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Gerar Estoque Inicial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)]" />
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2">Total de Peças</p>
          <h3 className="font-heading text-5xl">{totalItems}</h3>
        </div>
        <div className="card-premium relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2">Atenção (Baixo Estoque)</p>
          <h3 className="font-heading text-5xl text-yellow-500">{lowStockCount}</h3>
        </div>
        <div className="card-premium relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2">Crítico (Sem Estoque)</p>
          <h3 className="font-heading text-5xl text-red-500">{outOfStockCount}</h3>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={stockItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdjust={handleAdjust}
          onAdd={handleAdd}
          addButtonText="Adicionar Estoque"
          searchPlaceholder="Buscar por SKU, cor ou modelo..."
        />
      )}

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={adjustingItem ? `Ajustar Estoque: ${adjustingItem.sku}` : 'Ajustar Estoque'}
      >
        <form onSubmit={submitAdjust} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Estoque Atual: <span className="text-white font-heading text-xl">{adjustingItem?.stock}</span>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Tipo de Ajuste</label>
              <select
                name="adjustType"
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 appearance-none"
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
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 font-heading text-2xl"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Motivo / Observação</label>
              <input
                name="reason"
                required
                placeholder="Ex: Reposição, Descarte, Recontagem..."
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              />
            </div>
          </div>
          
          <div className="pt-6 flex justify-end gap-3 border-t border-[var(--color-border)] mt-8">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary !bg-blue-600 hover:!bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
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
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Categoria</label>
              <input
                name="category"
                defaultValue={editingItem?.category || 'shirt'}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
                placeholder="Ex: shirt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Modelo</label>
              <input
                name="model"
                defaultValue={editingItem?.model || 'oversized'}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
                placeholder="Ex: oversized"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">SKU</label>
              <input
                name="sku"
                defaultValue={editingItem?.sku || ''}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 uppercase"
                placeholder="Ex: OVR-BLK-M"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Tamanho</label>
              <select
                name="size"
                defaultValue={editingItem?.size || 'M'}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 appearance-none"
              >
                <option value="P">P</option>
                <option value="M">M</option>
                <option value="G">G</option>
                <option value="GG">GG</option>
                <option value="XGG">XGG</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Rótulo da Cor (Ex: Black)</label>
              <input
                name="color_label"
                defaultValue={editingItem?.color_label || ''}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
                placeholder="Ex: Black"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Chave Cor (Ex: blk)</label>
                <input
                  name="color_key"
                  defaultValue={editingItem?.color_key || ''}
                  required
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 lowercase"
                  placeholder="Ex: blk"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Hexadecimal</label>
                <input
                  name="color_hex"
                  type="color"
                  defaultValue={editingItem?.color_hex || '#000000'}
                  required
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 p-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Estoque Atual</label>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={editingItem?.stock ?? 0}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 font-heading text-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Estoque Mínimo de Alerta</label>
              <input
                name="min_stock"
                type="number"
                min="0"
                defaultValue={editingItem?.min_stock ?? 5}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Custo Unitário (R$)</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingItem?.cost ?? 42.0}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                name="active"
                id="active"
                defaultChecked={editingItem ? editingItem.active : true}
                className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--color-surface)]"
              />
              <label htmlFor="active" className="text-sm font-medium text-white">Item Ativo no Sistema</label>
            </div>
          </div>
          
          <div className="pt-6 flex justify-end gap-3 border-t border-[var(--color-border)] mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary"
            >
              {isProcessing ? 'Salvando...' : 'Salvar Estoque'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

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

  const totalItems = stockItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const lowStockCount = stockItems.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.minStock)).length;
  const outOfStockCount = stockItems.filter(i => Number(i.quantity) === 0).length;

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (isProcessing) return;
    if (window.confirm(`Tem certeza que deseja excluir o estoque de ${item.color} tamanho ${item.size}?`)) {
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
      await stockService.adjustStock(adjustingItem.id, adjustType === 'set' ? amount : (adjustType === 'in' ? amount : -amount), reason);
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
    const color = formData.get('color').trim();
    const size = formData.get('size');
    const quantity = Number(formData.get('quantity'));
    
    if (quantity < 0) {
      toast.error("Erro: A quantidade não pode ser negativa.");
      return;
    }

    // Prevenir duplicação de cor + tamanho
    if (!editingItem) {
      const exists = stockItems.some(
        item => item.color.toLowerCase() === color.toLowerCase() && item.size === size
      );
      if (exists) {
        toast.error(`Erro: Já existe estoque cadastrado para a cor ${color} no tamanho ${size}.`);
        return;
      }
    } else {
      const exists = stockItems.some(
        item => item.id !== editingItem.id && item.color.toLowerCase() === color.toLowerCase() && item.size === size
      );
      if (exists) {
        toast.error(`Erro: Já existe outro lote cadastrado para a cor ${color} no tamanho ${size}.`);
        return;
      }
    }

    const data = {
      color,
      size,
      quantity,
      minStock: Number(formData.get('minStock')),
      supplier: formData.get('supplier'),
      cost: Number(formData.get('cost')),
      width: Number(formData.get('width')),
      height: Number(formData.get('height')),
    };
    data.status = data.quantity === 0 ? 'sem estoque' : data.quantity <= data.minStock ? 'baixo estoque' : 'disponível';

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
      toast.error('Erro ao salvar lote de estoque.');
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      header: 'Cor / Tamanho',
      accessor: 'color',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div 
            className="w-6 h-6 rounded-full border border-[var(--color-border)] shadow-sm"
            style={{ backgroundColor: row.color.toLowerCase() === 'preta' ? '#000' : row.color.toLowerCase() === 'branca' ? '#fff' : row.color.toLowerCase() === 'vermelha' ? '#ff2b06' : '#ccc' }}
          />
          <div>
            <p className="font-medium text-white">{row.color}</p>
            <p className="text-xs text-[var(--color-text-muted)] font-heading tracking-wider">Tam: {row.size}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Quantidade',
      accessor: 'quantity',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-heading text-xl">{row.quantity}</span>
          <span className="text-xs text-[var(--color-text-muted)]">/ {row.minStock} min</span>
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
        
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${color} uppercase tracking-wider`}>
            {row.status}
          </span>
        );
      }
    },
    { header: 'Medidas (LxA)', accessor: 'measures', render: (row) => <span className="text-sm font-medium">{row.width}x{row.height} cm</span> },
    { header: 'Custo', accessor: 'cost', render: (row) => `R$ ${Number(row.cost || 0).toFixed(2)}` },
    { header: 'Última Atualização', accessor: 'updatedAt', render: (row) => new Date(row.updatedAt || row.createdAt || row.lastUpdate || new Date()).toLocaleDateString('pt-BR') }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-4xl mb-1">Estoque: Camisetas Lisas</h1>
          <p className="text-[var(--color-text-muted)]">Gerenciamento do estoque base para estampagem sob demanda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border-l-4 border-[var(--color-primary)]">
          <p className="text-[var(--color-text-muted)] text-sm font-medium mb-2">Total de Lisas</p>
          <h3 className="font-heading text-4xl">{totalItems}</h3>
        </div>
        <div className="glass-panel p-6 border-l-4 border-yellow-500">
          <p className="text-[var(--color-text-muted)] text-sm font-medium mb-2">Atenção (Baixo Estoque)</p>
          <h3 className="font-heading text-4xl text-yellow-500">{lowStockCount}</h3>
        </div>
        <div className="glass-panel p-6 border-l-4 border-red-500">
          <p className="text-[var(--color-text-muted)] text-sm font-medium mb-2">Crítico (Sem Estoque)</p>
          <h3 className="font-heading text-4xl text-red-500">{outOfStockCount}</h3>
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
          searchPlaceholder="Buscar por cor ou tamanho..."
        />
      )}

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={adjustingItem ? `Ajustar Estoque: ${adjustingItem.color} - ${adjustingItem.size}` : 'Ajustar Estoque'}
      >
        <form onSubmit={submitAdjust} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Estoque Atual: <span className="text-white font-heading text-xl">{adjustingItem?.quantity}</span>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Tipo de Ajuste</label>
              <select
                name="adjustType"
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
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
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors font-heading text-xl"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Motivo / Observação</label>
              <input
                name="reason"
                required
                placeholder="Ex: Reposição, Descarte, Recontagem..."
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 rounded-xl text-white bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-white bg-blue-500 hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
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
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Cor da Camiseta</label>
              <input
                name="color"
                defaultValue={editingItem?.color}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Ex: Preta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Tamanho</label>
              <select
                name="size"
                defaultValue={editingItem?.size || 'P'}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              >
                <option value="P">P</option>
                <option value="M">M</option>
                <option value="G">G</option>
                <option value="GG">GG</option>
                <option value="XGG">XGG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Quantidade Atual</label>
              <input
                name="quantity"
                type="number"
                min="0"
                defaultValue={editingItem?.quantity ?? 0}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors font-heading text-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Estoque Mínimo de Alerta</label>
              <input
                name="minStock"
                type="number"
                min="0"
                defaultValue={editingItem?.minStock ?? 5}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Fornecedor</label>
              <input
                name="supplier"
                defaultValue={editingItem?.supplier}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Nome da malharia..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Custo Unitário (R$)</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingItem?.cost ?? 0}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Largura (cm)</label>
              <input
                name="width"
                type="number"
                min="0"
                step="0.1"
                defaultValue={editingItem?.width || ''}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Ex: 50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Altura (cm)</label>
              <input
                name="height"
                type="number"
                min="0"
                step="0.1"
                defaultValue={editingItem?.height || ''}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Ex: 70"
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-white bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors glow-red font-medium disabled:opacity-50"
            >
              {isProcessing ? 'Salvando...' : 'Salvar Estoque'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

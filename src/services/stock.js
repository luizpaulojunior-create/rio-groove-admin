import api from '../lib/api';

function normalizeStock(item) {
  if (!item) return null;
  return {
    id: item.id,
    color: item.color || '',
    size: item.size || '',
    quantity: Number(item.quantity) || 0,
    minStock: Number(item.minStock || item.min_stock) || 0,
    supplier: item.supplier || '',
    cost: Number(item.cost) || 0,
    width: Number(item.width) || 0,
    height: Number(item.height) || 0,
    status: item.status || (Number(item.quantity) === 0 ? 'sem estoque' : (Number(item.quantity) <= Number(item.minStock || item.min_stock) ? 'baixo estoque' : 'disponível')),
    updatedAt: item.updatedAt || item.updated_at || item.created_at || new Date().toISOString()
  };
}

export const stockService = {
  async getStock() {
    try {
      const { data } = await api.get('/stock');
      return Array.isArray(data) ? data.map(normalizeStock) : [];
    } catch (e) {
      console.error('Erro ao buscar estoque:', e);
      return [];
    }
  },
  async getStockItem(id) {
    const { data } = await api.get(`/stock/${id}`);
    return normalizeStock(data);
  },
  async createStockItem(stockData) {
    const payload = {
      color: stockData.color,
      size: stockData.size,
      quantity: stockData.quantity,
      min_stock: stockData.minStock,
      supplier: stockData.supplier,
      cost: stockData.cost,
      width: stockData.width,
      height: stockData.height,
    };
    const { data } = await api.post('/stock', payload);
    return normalizeStock(data);
  },
  async updateStockItem(id, stockData) {
    const payload = {
      color: stockData.color,
      size: stockData.size,
      quantity: stockData.quantity,
      min_stock: stockData.minStock,
      supplier: stockData.supplier,
      cost: stockData.cost,
      width: stockData.width,
      height: stockData.height,
    };
    const { data } = await api.put(`/stock/${id}`, payload);
    return normalizeStock(data);
  },
  async deleteStockItem(id) {
    await api.delete(`/stock/${id}`);
    return true;
  },
  async adjustStock(id, quantity, reason) {
    const { data } = await api.post(`/stock/${id}/adjust`, { quantity, reason });
    return normalizeStock(data);
  }
};

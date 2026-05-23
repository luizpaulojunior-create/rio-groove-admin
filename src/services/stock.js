import api from '../lib/api';

function normalizeStock(item) {
  if (!item) return null;
  return {
    id: item.id,
    sku: item.sku || '',
    category: item.category || '',
    model: item.model || '',
    color_key: item.color_key || '',
    color_label: item.color_label || '',
    color_hex: item.color_hex || '',
    size: item.size || '',
    stock: Number(item.stock) || 0,
    min_stock: Number(item.min_stock) || 0,
    cost: Number(item.cost) || 0,
    active: item.active !== false,
    status: item.active === false ? 'inativo' : (Number(item.stock) === 0 ? 'sem estoque' : (Number(item.stock) <= Number(item.min_stock) ? 'baixo estoque' : 'disponível')),
    updatedAt: item.updated_at || item.created_at || new Date().toISOString()
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
    const { data } = await api.post('/stock', stockData);
    return normalizeStock(data);
  },
  async updateStockItem(id, stockData) {
    const { data } = await api.put(`/stock/${id}`, stockData);
    return normalizeStock(data);
  },
  async deleteStockItem(id) {
    await api.delete(`/stock/${id}`);
    return true;
  },
  async adjustStock(id, quantity, reason) {
    const { data } = await api.post(`/stock/${id}/adjust`, { quantity, reason });
    return normalizeStock(data);
  },
  async seedStockItems() {
    const { data } = await api.post('/stock/seed');
    return data;
  }
};

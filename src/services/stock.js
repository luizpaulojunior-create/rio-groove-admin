import api from '../lib/api';

export const stockService = {
  async getStock() {
    const { data } = await api.get('/stock');
    return data;
  },
  async getStockItem(id) {
    const { data } = await api.get(`/stock/${id}`);
    return data;
  },
  async createStockItem(stockData) {
    const { data } = await api.post('/stock', stockData);
    return data;
  },
  async updateStockItem(id, stockData) {
    const { data } = await api.put(`/stock/${id}`, stockData);
    return data;
  },
  async deleteStockItem(id) {
    await api.delete(`/stock/${id}`);
    return true;
  },
  async adjustStock(id, quantity, reason) {
    const { data } = await api.post(`/stock/${id}/adjust`, { quantity, reason });
    return data;
  }
};
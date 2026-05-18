import api from '../lib/api';

export const ordersService = {
  async getOrders() {
    const { data } = await api.get('/orders');
    return data;
  },
  async getOrder(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },
  async createOrder(orderData) {
    const { data } = await api.post('/orders', orderData);
    return data;
  },
  async updateOrderStatus(id, status) {
    const { data } = await api.put(`/orders/${id}/status`, { status });
    return data;
  },
  async deleteOrder(id) {
    await api.delete(`/orders/${id}`);
    return true;
  }
};
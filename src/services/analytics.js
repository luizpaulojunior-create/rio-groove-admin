import api from '../lib/api';

export const analyticsService = {
  async getDashboardStats() {
    const { data } = await api.get('/analytics/dashboard');
    return data;
  },
  async getSalesChartData(period = '30d') {
    const { data } = await api.get(`/analytics/sales?period=${period}`);
    return data;
  },
  async getTopProducts() {
    const { data } = await api.get('/analytics/top-products');
    return data;
  }
};
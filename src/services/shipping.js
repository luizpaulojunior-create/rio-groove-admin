import api from '../lib/api';

export const shippingService = {
  async getShipments() {
    const { data } = await api.get('/shipping/shipments');
    return data;
  },
  async getShipment(id) {
    const { data } = await api.get(`/shipping/shipments/${id}`);
    return data;
  },
  async calculateQuote(payload) {
    const { data } = await api.post('/shipping/quote', payload);
    return data;
  },
  async generateLabel(orderId) {
    const { data } = await api.post(`/shipping/label/${orderId}`);
    return data;
  },
  async printLabel(orderIds) {
    const { data } = await api.post('/shipping/label/print', { orderIds });
    return data;
  },
  async cancelLabel(orderId) {
    const { data } = await api.post(`/shipping/label/${orderId}/cancel`);
    return data;
  },
  async trackShipment(trackingCode) {
    const { data } = await api.get(`/shipping/track/${trackingCode}`);
    return data;
  },
  async getOAuthUrl() {
    const { data } = await api.get('/shipping/oauth-url');
    return data;
  },
  async handleOAuthCallback(code) {
    const { data } = await api.post('/shipping/oauth-callback', { code });
    return data;
  },
  async getConnectionStatus() {
    const { data } = await api.get('/shipping/status');
    return data;
  }
};

import api from '../lib/api';

/** Base da API sem sufixo /api — usado para OAuth Melhor Envio (redirect browser). */
export function getBackendRootUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://rio-groove-backend.onrender.com/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

/**
 * Contratos alinhados ao backend real (Fase 2).
 * Removidas rotas fantasmas: /shipping/shipments, /shipping/oauth-url, etc.
 */
export const shippingService = {
  async calculateQuote(payload) {
    const { data } = await api.post('/shipping/quote', payload);
    return data;
  },

  async purchaseShipping(orderReference) {
    const { data } = await api.post('/shipping/purchase', { reference: orderReference });
    return data;
  },

  async generateLabel(orderReference) {
    const { data } = await api.post('/shipping/label', { reference: orderReference });
    return data;
  },

  /** orderReference = id, order_number ou external_reference do pedido */
  async trackShipment(orderReference) {
    const { data } = await api.get(`/shipping/tracking/${encodeURIComponent(orderReference)}`);
    return data;
  },

  /** URL de OAuth Melhor Envio — GET /auth/melhor-envio/login (redirect browser) */
  getMelhorEnvioLoginUrl() {
    return `${getBackendRootUrl()}/auth/melhor-envio/login`;
  },
};

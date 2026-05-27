import api from '../lib/api';

/** Base da API sem sufixo /api — usado para OAuth Melhor Envio (redirect browser). */
export function getBackendRootUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://rio-groove-backend.onrender.com/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Contratos alinhados ao backend real (Fase 2).
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

  /** Compra frete (se necessário), gera etiqueta, salva rastreio e atualiza status do pedido */
  async fulfillLabel(orderReference) {
    const { data } = await api.post('/shipping/label/fulfill', { reference: orderReference });
    return data;
  },

  async generateLabel(orderReference) {
    const { data } = await api.post('/shipping/label', { reference: orderReference });
    return data;
  },

  /** Baixa PDF da etiqueta. Retorna true se download iniciou, false se veio link JSON */
  async downloadLabelPdf(orderReference, filename) {
    try {
      const response = await api.get(`/shipping/label/${encodeURIComponent(orderReference)}/pdf`, {
        responseType: 'blob',
      });

      const contentType = String(response.headers['content-type'] || '');

      if (contentType.includes('application/pdf')) {
        triggerBlobDownload(response.data, filename || `etiqueta-${orderReference}.pdf`);
        return { downloaded: true };
      }

      const text = await response.data.text();
      const json = JSON.parse(text);
      if (json.labelUrl) {
        window.open(json.labelUrl, '_blank', 'noopener,noreferrer');
        return { downloaded: false, labelUrl: json.labelUrl };
      }
      throw new Error(json.message || 'PDF da etiqueta indisponível.');
    } catch (error) {
      const blob = error?.response?.data;
      if (blob instanceof Blob) {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || 'Falha ao baixar PDF da etiqueta.');
        } catch (parseError) {
          if (parseError.message && parseError.message !== text) throw parseError;
        }
      }
      throw error;
    }
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

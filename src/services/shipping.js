import api, { getBackendRootUrl } from '../lib/api';

export { getBackendRootUrl };

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function blobLooksLikePdf(blob) {
  if (!(blob instanceof Blob)) return false;
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
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

  /** Baixa PDF da etiqueta. Retorna true se download iniciou. */
  async downloadLabelPdf(orderReference, filename) {
    try {
      const response = await api.get(`/shipping/label/${encodeURIComponent(orderReference)}/pdf`, {
        responseType: 'blob',
      });

      const blob = response.data;
      const contentType = String(response.headers['content-type'] || '');

      if (contentType.includes('application/pdf') || await blobLooksLikePdf(blob)) {
        triggerBlobDownload(blob, filename || `etiqueta-${orderReference}.pdf`);
        return { downloaded: true };
      }

      const text = await blob.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('Resposta inválida ao baixar PDF da etiqueta.');
      }

      throw new Error(json.message || 'PDF da etiqueta indisponível.');
    } catch (error) {
      const blob = error?.response?.data;
      if (blob instanceof Blob) {
        if (await blobLooksLikePdf(blob)) {
          triggerBlobDownload(blob, filename || `etiqueta-${orderReference}.pdf`);
          return { downloaded: true };
        }
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

  /** Inicia OAuth Melhor Envio (superadmin) — retorna URL assinada para redirect */
  async startMelhorEnvioOAuth() {
    const { data } = await api.post('/auth/melhor-envio/start');
    return data;
  },
};

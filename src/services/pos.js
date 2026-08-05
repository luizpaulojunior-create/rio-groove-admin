import api from '../lib/api';

export const posService = {
  /**
   * Registra venda presencial: baixa blank e grava a estampa no pedido.
   * @param {{
   *   items: Array<Record<string, unknown>>,
   *   paymentMethod: 'pix'|'cash'|'card',
   *   fairName?: string,
   *   customerName?: string,
   *   notes?: string,
   * }} payload
   */
  async createSale(payload) {
    const { data } = await api.post('/pos/sales', payload);
    return data;
  },
};

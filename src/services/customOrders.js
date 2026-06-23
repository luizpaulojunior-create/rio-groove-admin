import api from '../lib/api';

export const CUSTOM_ORDER_STATUSES = [
  { id: 'received', label: 'Recebido' },
  { id: 'reviewing', label: 'Em análise' },
  { id: 'mockup_ready', label: 'Mockup pronto' },
  { id: 'art_paid', label: 'Arte paga' },
  { id: 'awaiting_product_payment', label: 'Aguardando peça' },
  { id: 'in_production', label: 'Em produção' },
  { id: 'shipped', label: 'Enviado' },
  { id: 'completed', label: 'Concluído' },
  { id: 'cancelled', label: 'Cancelado' },
];

export const customOrdersService = {
  async getOrders(status = 'all') {
    const params = status !== 'all' ? { status } : {};
    const { data } = await api.get('/custom-orders', { params });
    return data;
  },

  async getOrder(id) {
    const { data } = await api.get(`/custom-orders/${id}`);
    return data;
  },

  async updateOrder(id, payload, mockupFile = null) {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        form.append(key, String(value));
      }
    });
    if (mockupFile) form.append('mockup', mockupFile);

    const { data } = await api.patch(`/custom-orders/${id}`, form, {
      timeout: mockupFile ? 120000 : 25000,
    });
    return data;
  },

  async incrementRevision(id) {
    const { data } = await api.post(`/custom-orders/${id}/revisions`);
    return data;
  },

  async quoteShipping(id, cep) {
    const { data } = await api.post(`/custom-orders/${id}/shipping-quote`, cep ? { cep } : {});
    return data;
  },

  async reconcilePayment(id, paymentId) {
    const { data } = await api.post(`/custom-orders/${id}/reconcile-payment`, {
      payment_id: paymentId,
    });
    return data;
  },
};

export function formatInsumoLabel(order) {
  if (!order) return '';
  if (order.segmento === 'cropped') return 'Cropped';
  return order.insumo || '';
}

export function buildAdminWhatsAppUrl(order) {
  const phone = '5521964456789';
  const text = encodeURIComponent(
    `Olá ${order.contact_name || ''}! Sobre seu pedido personalizado ${order.protocol}. `,
  );
  return `https://wa.me/${phone}?text=${text}`;
}

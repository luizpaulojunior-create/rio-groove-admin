import api from '../lib/api';

export const CUSTOM_ORDER_STATUSES = [
  { id: 'received', label: 'Recebido' },
  { id: 'reviewing', label: 'Em análise' },
  { id: 'quoted', label: 'Orçamento enviado' },
  { id: 'mockup_sent', label: 'Mockup enviado' },
  { id: 'awaiting_approval', label: 'Aguardando aprovação' },
  { id: 'awaiting_payment', label: 'Aguardando pagamento' },
  { id: 'paid', label: 'Pago' },
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

    const { data } = await api.patch(`/custom-orders/${id}`, form);
    return data;
  },
};

export function formatInsumoLabel(order) {
  if (!order) return '';
  if (order.segmento === 'cropped') return 'Cropped';
  return order.insumo || '';
}

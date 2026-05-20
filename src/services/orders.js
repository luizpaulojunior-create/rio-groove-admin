import api from '../lib/api';

const STATUS_MAP = {
  pending_payment: 'aguardando_pagamento',
  pending: 'aguardando_pagamento',
  paid: 'pagamento_aprovado',
  approved: 'pagamento_aprovado',
  reserved: 'estoque_reservado',
  production_pending: 'aguardando_producao',
  in_production: 'em_producao',
  production_done: 'producao_concluida',
  shipping_pending: 'preparando_envio',
  label_generated: 'etiqueta_gerada',
  shipped: 'postado',
  in_transit: 'em_transito',
  out_for_delivery: 'saiu_para_entrega',
  delivered: 'entregue',
  cancelled: 'cancelado'
};

const STATUS_LABELS = {
  aguardando_pagamento: 'Aguardando Pagamento',
  pagamento_aprovado: 'Pagamento Aprovado',
  estoque_reservado: 'Estoque Reservado',
  aguardando_producao: 'Aguardando Produção',
  em_producao: 'Em Produção',
  producao_concluida: 'Produção Concluída',
  preparando_envio: 'Preparando Envio',
  etiqueta_gerada: 'Etiqueta Gerada',
  postado: 'Postado',
  em_transito: 'Em Trânsito',
  saiu_para_entrega: 'Saiu para Entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
};

const TIMELINE_STEPS = {
  aguardando_pagamento: 0,
  pagamento_aprovado: 1,
  estoque_reservado: 2,
  aguardando_producao: 3,
  em_producao: 4,
  producao_concluida: 5,
  preparando_envio: 6,
  etiqueta_gerada: 7,
  postado: 8,
  em_transito: 9,
  saiu_para_entrega: 10,
  entregue: 11,
  cancelado: -1
};

function normalizeStatus(order) {
  if (!order) return 'aguardando_pagamento';

  let rawStatus = 
    order.status ||
    order.order_status ||
    order.payment_status ||
    order.fulfillment_status ||
    order.shipping_status ||
    order.state ||
    order.current_status ||
    order.metadata?.status;

  if (!rawStatus) {
    if (Array.isArray(order.logs) && order.logs.length > 0) {
      const lastLog = order.logs[order.logs.length - 1];
      rawStatus = lastLog?.status || lastLog?.action;
    } else if (Array.isArray(order.timeline) && order.timeline.length > 0) {
      const lastTimeline = order.timeline[order.timeline.length - 1];
      rawStatus = lastTimeline?.status || lastTimeline?.state;
    }
  }

  if (typeof rawStatus === 'object' && rawStatus !== null) {
    rawStatus = rawStatus.name || rawStatus.status || rawStatus.state || 'pending_payment';
  }

  if (typeof rawStatus !== 'string' || !rawStatus.trim()) {
    rawStatus = 'pending_payment';
  }

  const normalizedRaw = rawStatus.toLowerCase().trim();
  
  if (STATUS_MAP[normalizedRaw]) {
    return STATUS_MAP[normalizedRaw];
  }
  
  if (Object.values(STATUS_MAP).includes(normalizedRaw)) {
    return normalizedRaw;
  }

  return 'aguardando_pagamento';
}

function normalizeOrder(order) {
  if (!order || typeof order !== 'object') return {};
  
  const raw =
    order?.raw_checkout_payload || {};

  const address =
    raw?.address || order?.address || order?.shippingInfo || {};

  const customer =
    raw?.customer || order?.customer || {};

  const shipping =
    raw?.shipping || order?.shippingInfo || {};

  const rawItems = raw?.items || order?.items;
  const items = Array.isArray(rawItems) ? rawItems : [];

  const total =
    Number(
      order?.total_amount ||
      raw?.totals?.total ||
      0
    );

  const paymentStatus =
    order?.payment_status ||
    'pending';

  const shippingStatus =
    order?.shipping_status ||
    'processing';

  const productionStatus =
    order?.production_status ||
    'pending';

  const normalizedStatus = normalizeStatus(order);

  return {
    ...order,

    // CLIENTE
    customer: {
      name:
        order?.customer_name ||
        customer?.name ||
        '-',

      email:
        order?.customer_email ||
        customer?.email ||
        '-',

      phone:
        order?.customer_phone ||
        customer?.phone ||
        '-',

      cpf:
        order?.customer_cpf ||
        customer?.cpf ||
        '-',
    },

    customer_name:
      order?.customer_name ||
      customer?.name ||
      '-',

    customer_email:
      order?.customer_email ||
      customer?.email ||
      '-',

    customer_phone:
      order?.customer_phone ||
      customer?.phone ||
      '-',

    customer_cpf:
      order?.customer_cpf ||
      customer?.cpf ||
      '-',

    // TOTAL
    total,

    total_amount:
      total,

    // STATUS
    status: normalizedStatus,
    statusLabel: STATUS_LABELS[normalizedStatus] || 'Desconhecido',
    timelineStep: TIMELINE_STEPS[normalizedStatus] !== undefined ? TIMELINE_STEPS[normalizedStatus] : 0,
    payment_status: String(paymentStatus),
    shipping_status: String(shippingStatus),
    production_status: String(productionStatus),

    // DATAS
    createdAt: String(order?.created_at || order?.createdAt || new Date().toISOString()),
    created_at: String(order?.created_at || order?.createdAt || new Date().toISOString()),
    paid_at: order?.paid_at ? String(order.paid_at) : null,

    // ENDEREÇO OBJETO
    address: {
      cep: String(address?.cep || address?.zipCode || '-'),
      street: String(address?.street || address?.address || '-'),
      number: String(address?.number || '-'),
      complement: String(address?.complement || ''),
      neighborhood: String(address?.neighborhood || '-'),
      city: String(address?.city || '-'),
      state: String(address?.state || '-'),
    },

    // CAMPOS INDIVIDUAIS
    shipping_cep: String(address?.cep || address?.zipCode || '-'),
    shipping_street: String(address?.street || address?.address || '-'),
    shipping_number: String(address?.number || '-'),
    shipping_complement: String(address?.complement || ''),
    shipping_neighborhood: String(address?.neighborhood || '-'),
    shipping_city: String(address?.city || '-'),
    shipping_state: String(address?.state || '-'),

    // STRING FORMATADA
    shipping_address: `
${address?.street || '-'}, ${address?.number || '-'}
${address?.neighborhood || '-'}
${address?.city || '-'} - ${address?.state || '-'}
CEP: ${address?.cep || '-'}
`.trim(),

    // ENVIO
    shipping_method:
      shipping?.label ||
      'Correios/Jadlog',

    shipping_deadline:
      shipping?.deadline ||
      '-',

    shipping_amount:
      shipping?.price ||
      0,

    tracking_code:
      order?.tracking_code ||
      '',

    // ITENS
    items: items.map((item) => ({
      id: item?.id || crypto.randomUUID(),
      title: String(item?.title || item?.name || item?.product?.name || 'Produto'),
      name: String(item?.title || item?.name || item?.product?.name || 'Produto'),
      image: typeof item?.image === 'string' ? item.image : (item?.product?.images?.[0]?.url || item?.product?.images?.[0] || ''),
      quantity: Number(item?.quantity || 1),
      price: Number(item?.price || item?.unit_price || 0),
      size: String(item?.size || '-'),
      color: String(item?.color || '-'),
      sku: String(item?.sku || item?.product?.sku || 'N/A'),
      estamp: String(item?.side || item?.product?.printType || 'Frente'),
      stock_status: 'Pendente',
      product: {
        name: String(item?.title || item?.name || item?.product?.name || 'Produto'),
        sku: String(item?.sku || item?.product?.sku || 'N/A'),
        printType: String(item?.side || item?.product?.printType || 'Frente'),
        images: Array.isArray(item?.product?.images) ? item.product.images : []
      }
    })),

    logs: Array.isArray(order?.logs) && order.logs.length > 0 
      ? order.logs.map((log, idx) => ({
          id: log?.id || idx,
          message: String(log?.message || log?.action || 'Atualização'),
          action: String(log?.action || log?.message || 'Atualização'),
          created_at: String(log?.created_at || log?.createdAt || new Date().toISOString()),
          createdAt: String(log?.createdAt || log?.created_at || new Date().toISOString()),
          user: String(log?.user || 'Sistema'),
          details: String(log?.details || log?.description || '')
        }))
      : [
          {
            id: 1,
            message: 'Pedido criado',
            action: 'Pedido criado',
            created_at: String(order?.created_at || order?.createdAt || new Date().toISOString()),
            createdAt: String(order?.created_at || order?.createdAt || new Date().toISOString()),
            user: 'Sistema',
          },
          ...(order?.paid_at
            ? [
                {
                  id: 2,
                  message: 'Pagamento aprovado',
                  action: 'Pagamento aprovado',
                  created_at: String(order?.paid_at),
                  createdAt: String(order?.paid_at),
                  user: 'Mercado Pago',
                },
              ]
            : []),
        ],
  };
}

export const ordersService = {
  async getOrders() {
    try {
      const response =
        await api.get('/orders');

      const rawData =
        response?.data;

      const orders =
        Array.isArray(rawData)
          ? rawData
          : Array.isArray(
                rawData?.orders
              )
            ? rawData.orders
            : [];

      return orders.map(
        normalizeOrder
      );
    } catch (error) {
      console.error(
        'Erro ao buscar pedidos:',
        error
      );

      return [];
    }
  },

  async getOrder(id) {
    try {
      const response =
        await api.get(
          `/orders/${id}`
        );

      const rawData =
        response?.data;

      const order =
        rawData?.order ||
        rawData;

      return normalizeOrder(
        order
      );
    } catch (error) {
      console.error(
        'Erro ao buscar pedido:',
        error
      );

      return null;
    }
  },

  async createOrder(orderData) {
    const { data } =
      await api.post(
        '/orders',
        orderData
      );

    return data;
  },

  async updateOrderStatus(
    id,
    status,
    extraData = {}
  ) {
    const { data } =
      await api.put(
        `/orders/${id}/status`,
        { status, ...extraData }
      );

    return data;
  },

  async deleteOrder(id) {
    await api.delete(
      `/orders/${id}`
    );

    return true;
  },
};
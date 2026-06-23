import api from '../lib/api';

const STATUS_MAP = {
  pending_payment: 'aguardando_pagamento',
  pending: 'aguardando_pagamento',
  paid: 'pagamento_aprovado',
  approved: 'pagamento_aprovado',
  reserved: 'aguardando_producao',
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

function resolveItemPrice(item) {
  const meta = item?.metadata_json || item?.raw || {};
  const qty = Number(item?.quantity || 1);
  const lineTotal = Number(item?.line_total || item?.lineTotal || meta?.lineTotal || meta?.line_total || 0);
  let price = Number(
    item?.unit_price ||
      item?.unitPrice ||
      item?.price ||
      meta?.unitPrice ||
      meta?.unit_price ||
      meta?.price ||
      0,
  );
  if (price <= 0 && lineTotal > 0 && qty > 0) {
    price = lineTotal / qty;
  }
  return price;
}

function resolveShippingAmount(order, raw, shipping) {
  const amount =
    order?.shipping_amount ??
    raw?.shipping?.price ??
    raw?.totals?.shipping ??
    shipping?.price;
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isOrderPaid(order) {
  if (!order) return false;
  const paymentStatus = String(order.payment_status || '').toLowerCase();
  const orderStatus = String(order.status || '').toLowerCase();
  return (
    paymentStatus === 'paid' ||
    paymentStatus === 'approved' ||
    Boolean(order.paid_at) ||
    orderStatus === 'paid' ||
    orderStatus === 'fulfilled' ||
    orderStatus === 'pagamento_aprovado'
  );
}

function normalizeStatus(order) {
  if (!order) return 'aguardando_pagamento';

  const paid = isOrderPaid(order);

  if (paid) {
    const fulfillment = order.fulfillment_status;
    if (!fulfillment || fulfillment === 'aguardando_pagamento') {
      return 'pagamento_aprovado';
    }
    if (fulfillment === 'estoque_reservado') {
      return 'aguardando_producao';
    }
    if (STATUS_LABELS[fulfillment]) {
      return fulfillment;
    }
    return 'pagamento_aprovado';
  }

  if (order.fulfillment_status && STATUS_LABELS[order.fulfillment_status]) {
    if (order.fulfillment_status === 'estoque_reservado') {
      return 'aguardando_producao';
    }
    return order.fulfillment_status;
  }

  let rawStatus =
    order.status ||
    order.order_status ||
    order.payment_status ||
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
    if (normalizedRaw === 'estoque_reservado') {
      return 'aguardando_producao';
    }
    return normalizedRaw;
  }

  if (order.payment_status === 'paid' || order.paid_at) {
    return 'pagamento_aprovado';
  }

  return 'aguardando_pagamento';
}

function mapOrderItem(item) {
  const meta = item?.metadata_json || {};
  const name = String(
    item?.product_name ||
      item?.productName ||
      item?.title ||
      item?.name ||
      item?.product?.name ||
      meta?.productName ||
      meta?.name ||
      'Produto',
  );
  const price = resolveItemPrice(item);
  const sku = String(item?.sku || meta?.sku || 'N/A');
  const image =
    item?.image_url ||
    item?.imageUrl ||
    item?.image ||
    meta?.imageUrl ||
    meta?.image_url ||
    item?.product?.images?.[0]?.url ||
    item?.product?.images?.[0] ||
    '';

  return {
    id: item?.id || crypto.randomUUID(),
    title: name,
    name,
    image: typeof image === 'string' ? image : '',
    quantity: Number(item?.quantity || 1),
    price,
    unit_price: price,
    size: String(item?.size || '-'),
    color: String(item?.color || '-'),
    sku,
    estamp: String(item?.side || meta?.side || item?.product?.printType || 'Frente'),
    stock_status: 'Pendente',
    product: {
      name,
      sku,
      printType: String(item?.side || meta?.side || item?.product?.printType || 'Frente'),
      images: Array.isArray(item?.product?.images) ? item.product.images : image ? [image] : [],
    },
  };
}

function mapOrderItems(order, raw) {
  if (Array.isArray(order?.order_items) && order.order_items.length > 0) {
    return order.order_items.map(mapOrderItem);
  }

  const payloadItems = raw?.items;
  if (Array.isArray(payloadItems) && payloadItems.length > 0) {
    return payloadItems.map(mapOrderItem);
  }

  if (Array.isArray(order?.items) && order.items.length > 0) {
    return order.items.map(mapOrderItem);
  }

  return [];
}

function mapOrderLogs(order) {
  const source = order?.order_logs || order?.logs;
  if (Array.isArray(source) && source.length > 0) {
    return source.map((log, idx) => ({
      id: log?.id || idx,
      message: String(log?.message || log?.action || 'Atualização'),
      action: String(log?.action || log?.message || 'Atualização'),
      created_at: String(log?.created_at || log?.createdAt || new Date().toISOString()),
      createdAt: String(log?.createdAt || log?.created_at || new Date().toISOString()),
      user: String(log?.user || 'Sistema'),
      details: String(log?.details || log?.description || ''),
    }));
  }

  return [
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
            created_at: String(order.paid_at),
            createdAt: String(order.paid_at),
            user: 'Mercado Pago',
          },
        ]
      : []),
  ];
}

export function getOrderDisplayStatus(order) {
  if (!order) return 'aguardando_pagamento';
  if (order.timelineStep && STATUS_LABELS[order.timelineStep]) {
    return order.timelineStep;
  }
  if (order.status && STATUS_LABELS[order.status]) {
    return order.status;
  }
  return normalizeStatus(order);
}

export { isOrderPaid };

export function isPickupOrder(order) {
  const method = String(
    order?.shipping_method ||
      order?.shippingMethod ||
      order?.raw_checkout_payload?.shipping?.label ||
      '',
  ).toLowerCase();
  return method.includes('retirada');
}

function parseRawPayload(order) {
  const raw = order?.raw_checkout_payload;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

function normalizeOrder(order) {
  if (!order || typeof order !== 'object') return {};
  
  const raw = parseRawPayload(order);

  const address = {
    cep: String(order?.shipping_cep || raw?.address?.cep || raw?.address?.zipCode || '-'),
    street: String(order?.shipping_street || raw?.address?.street || raw?.address?.address || '-'),
    number: String(order?.shipping_number || raw?.address?.number || '-'),
    complement: String(order?.shipping_complement || raw?.address?.complement || ''),
    neighborhood: String(order?.shipping_neighborhood || raw?.address?.neighborhood || '-'),
    city: String(order?.shipping_city || raw?.address?.city || '-'),
    state: String(order?.shipping_state || raw?.address?.state || '-'),
  };

  const customer = raw?.customer || order?.customer || {};
  const shipping = raw?.shipping || order?.shippingInfo || {};
  const items = mapOrderItems(order, raw);
  const shippingAmount = resolveShippingAmount(order, raw, shipping);

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
    fulfillment_status: normalizedStatus,
    statusLabel: STATUS_LABELS[normalizedStatus] || 'Desconhecido',
    timelineStep: normalizedStatus,
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
    shipping_method: order?.shipping_method || shipping?.label || raw?.shipping?.label || 'Correios/Jadlog',

    shipping_deadline: order?.shipping_deadline || shipping?.deadline || raw?.shipping?.deadline || '-',

    shipping_amount: shippingAmount,

    shipping_price: shippingAmount,

    shippingInfo: {
      method: order?.shipping_method || shipping?.label || raw?.shipping?.label || '',
      price: shippingAmount,
      address: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.cep,
    },

    tracking_code: order?.shipping_tracking_code || order?.tracking_code || '',
    trackingCode: order?.shipping_tracking_code || order?.tracking_code || '',
    shipping_label_url: order?.shipping_label_url || '',
    melhor_envio_shipment_id: order?.melhor_envio_shipment_id || '',

    items,

    logs: mapOrderLogs(order),
  };
}

export const ordersService = {
  async getOrders() {
    try {
      const response =
        await api.get('/orders', { params: { limit: 200 } });

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

  async updateOrderStatus(id, status, extraData = {}) {
    const { data } = await api.put(`/orders/${id}/status`, { status, ...extraData });
    return normalizeOrder(data?.order || data);
  },

  async reconcilePayment(reference, paymentId) {
    const ref = reference || '';
    const { data } = await api.post(
      `/orders/${encodeURIComponent(ref)}/reconcile-payment-admin`,
      { payment_id: paymentId },
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
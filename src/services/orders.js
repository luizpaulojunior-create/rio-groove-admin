import api from '../lib/api';

function normalizeOrder(order) {
  const raw =
    order?.raw_checkout_payload || {};

  const address =
    raw?.address || {};

  const customer =
    raw?.customer || {};

  const shipping =
    raw?.shipping || {};

  const items = Array.isArray(
    raw?.items
  )
    ? raw.items
    : [];

  return {
    ...order,

    customer_name:
      order?.customer_name ||
      customer?.name ||
      'Cliente',

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

    shipping_method:
      order?.shipping_method ||
      shipping?.label ||
      'Não informado',

    shipping_deadline:
      order?.shipping_deadline ||
      shipping?.deadline ||
      '-',

    shipping_amount:
      order?.shipping_amount ||
      shipping?.price ||
      0,

    address: {
      cep:
        order?.shipping_cep ||
        address?.cep ||
        '-',

      street:
        order?.shipping_street ||
        address?.street ||
        '-',

      number:
        order?.shipping_number ||
        address?.number ||
        '-',

      complement:
        order?.shipping_complement ||
        address?.complement ||
        '',

      neighborhood:
        order?.shipping_neighborhood ||
        address?.neighborhood ||
        '-',

      city:
        order?.shipping_city ||
        address?.city ||
        '-',

      state:
        order?.shipping_state ||
        address?.state ||
        '-',
    },

    items: items.map((item) => ({
      id:
        item?.id ||
        crypto.randomUUID(),

      title:
        item?.title ||
        item?.name ||
        'Produto',

      name:
        item?.title ||
        item?.name ||
        'Produto',

      image:
        item?.image || '',

      quantity:
        item?.quantity || 1,

      price:
        item?.price ||
        item?.unit_price ||
        0,

      size:
        item?.size || '-',

      color:
        item?.color || '-',

      slug:
        item?.slug || '',
    })),

    logs: [
      {
        id: 1,
        message:
          'Pedido criado',
        created_at:
          order?.created_at,
        user: 'Sistema',
      },

      ...(order?.paid_at
        ? [
            {
              id: 2,
              message:
                'Pagamento aprovado',
              created_at:
                order?.paid_at,
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
        await api.get('/orders', {
          headers: {
            'Cache-Control':
              'no-cache',
            Pragma: 'no-cache',
          },
        });

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
          `/orders/${id}`,
          {
            headers: {
              'Cache-Control':
                'no-cache',
              Pragma:
                'no-cache',
            },
          }
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
    status
  ) {
    const { data } =
      await api.put(
        `/orders/${id}/status`,
        { status }
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
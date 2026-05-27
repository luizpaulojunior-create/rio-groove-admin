/**
 * KPIs calculados a partir de pedidos e estoque já carregados no admin.
 * Backend /analytics/* não implementado — evita stubs zerados no Dashboard.
 */

const PAID_STATUSES = new Set(['paid', 'pagamento_aprovado', 'fulfilled']);
const CANCELLED_STATUSES = new Set(['cancelled', 'cancelado', 'refunded', 'payment_failed']);

function parseOrderDate(order) {
  return new Date(order.created_at || order.createdAt || 0);
}

function isPaidOrder(order) {
  if (CANCELLED_STATUSES.has(String(order.status || '').toLowerCase())) return false;
  if (order.fulfillment_status === 'cancelado') return false;
  if (order.paid_at) return true;
  if (order.payment_status === 'paid' || order.payment_status === 'approved') return true;
  return PAID_STATUSES.has(String(order.status || '').toLowerCase());
}

function isCancelledOrder(order) {
  const status = String(order.status || '').toLowerCase();
  return CANCELLED_STATUSES.has(status) || order.fulfillment_status === 'cancelado';
}

function orderTotal(order) {
  return Number(order.total_amount ?? order.total ?? 0);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days) {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - days);
  return d;
}

export function buildDashboardStats(orders = [], stockItems = []) {
  const paidOrders = orders.filter(isPaidOrder);
  const totalSales = paidOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const totalOrders = orders.filter((order) => !isCancelledOrder(order)).length;
  const averageTicket = paidOrders.length ? totalSales / paidOrders.length : 0;

  const todayStart = startOfDay(new Date());
  const yesterdayStart = daysAgo(1);
  const todayOrdersList = orders.filter((order) => parseOrderDate(order) >= todayStart);
  const yesterdayOrdersList = orders.filter((order) => {
    const date = parseOrderDate(order);
    return date >= yesterdayStart && date < todayStart;
  });

  const todayOrders = todayOrdersList.length;
  const yesterdayOrders = yesterdayOrdersList.length;
  const todayOrdersGrowth = yesterdayOrders
    ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100)
    : todayOrders > 0
      ? 100
      : 0;

  const last30Start = daysAgo(30);
  const prev30Start = daysAgo(60);
  const salesLast30 = paidOrders
    .filter((order) => parseOrderDate(order) >= last30Start)
    .reduce((sum, order) => sum + orderTotal(order), 0);
  const salesPrev30 = paidOrders
    .filter((order) => {
      const date = parseOrderDate(order);
      return date >= prev30Start && date < last30Start;
    })
    .reduce((sum, order) => sum + orderTotal(order), 0);
  const salesGrowth = salesPrev30
    ? Math.round(((salesLast30 - salesPrev30) / salesPrev30) * 100)
    : salesLast30 > 0
      ? 100
      : 0;

  const totalProductsSold = paidOrders.reduce((sum, order) => {
    const items = order.items || order.order_items || [];
    if (!Array.isArray(items)) return sum;
    return sum + items.reduce((itemSum, item) => itemSum + Number(item.quantity || 1), 0);
  }, 0);

  const lowStock = stockItems.filter(
    (item) => Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.min_stock || 0)
  ).length;
  const outOfStock = stockItems.filter((item) => Number(item.quantity) === 0).length;

  return {
    available: true,
    totalSales,
    salesGrowth,
    todayOrders,
    todayOrdersGrowth,
    totalOrders,
    averageTicket,
    totalProductsSold,
    lowStockItems: lowStock,
    outOfStockItems: outOfStock,
  };
}

export function buildSalesChartData(orders = [], period = '30d') {
  const days = period === '7d' ? 7 : 30;
  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = daysAgo(days - 1 - index);
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weekday: labels[date.getDay()],
      revenue: 0,
      orders: 0,
    };
  });

  for (const order of orders.filter(isPaidOrder)) {
    const orderDate = startOfDay(parseOrderDate(order));
    const bucket = buckets.find((entry) => {
      const [day, month] = entry.date.split('/');
      const bucketDate = new Date(orderDate.getFullYear(), Number(month) - 1, Number(day));
      return bucketDate.getTime() === orderDate.getTime();
    });
    if (!bucket) continue;
    bucket.revenue += orderTotal(order);
    bucket.orders += 1;
  }

  if (days <= 7) {
    return buckets.map((entry) => ({
      date: entry.weekday,
      revenue: Number(entry.revenue.toFixed(2)),
      orders: entry.orders,
    }));
  }

  return buckets.map((entry) => ({
    date: entry.date,
    revenue: Number(entry.revenue.toFixed(2)),
    orders: entry.orders,
  }));
}

export function buildTopProducts(orders = [], limit = 5) {
  const map = new Map();

  for (const order of orders.filter(isPaidOrder)) {
    const items = order.items || order.order_items || [];
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      const name = item.product_name || item.product?.name || item.name || item.title || 'Produto';
      const key = String(name);
      const current = map.get(key) || { name: key, quantity: 0, revenue: 0 };
      const qty = Number(item.quantity || 1);
      const lineTotal = Number(item.line_total ?? item.lineTotal ?? (Number(item.unit_price || item.price || 0) * qty));
      current.quantity += qty;
      current.revenue += lineTotal;
      map.set(key, current);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

/** @deprecated Use buildDashboardStats(orders, stockItems) */
export const analyticsService = {
  async getDashboardStats() {
    return buildDashboardStats();
  },

  async getSalesChartData(period = '30d') {
    return buildSalesChartData([], period);
  },

  async getTopProducts() {
    return buildTopProducts();
  },
};

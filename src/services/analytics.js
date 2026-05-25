/**
 * Contratos alinhados ao backend real (Fase 2).
 * Rotas inexistentes removidas — ver API_CONTRACTS.md.
 *
 * Backend /analytics/* não implementado: KPIs vêm de orders/stock no Dashboard.
 */
export const analyticsService = {
  async getDashboardStats() {
    return {
      available: false,
      totalSales: 0,
      salesGrowth: 0,
      todayOrders: 0,
      todayOrdersGrowth: 0,
      totalOrders: 0,
      ordersGrowth: 0,
      newCustomers: 0,
      customersGrowth: 0,
      itemsConsumed: 0,
      topSizes: [],
      topColors: [],
    };
  },

  async getSalesChartData(_period = '30d') {
    return [];
  },

  async getTopProducts() {
    return [];
  },
};

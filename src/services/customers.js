import { ordersService } from './orders';

export const customersService = {
  async getCustomers() {
    try {
      const orders = await ordersService.getOrders();
      const customersMap = {};

      orders.forEach(order => {
        const email = order.customer?.email && order.customer.email !== '-' ? order.customer.email : null;
        const phone = order.customer?.phone && order.customer.phone !== '-' ? order.customer.phone : null;
        const cpf = order.customer?.cpf && order.customer.cpf !== '-' ? order.customer.cpf : null;
        const name = order.customer?.name && order.customer.name !== '-' ? order.customer.name : 'Desconhecido';
        
        // Prefer email as ID, then CPF, then phone, then name
        const uniqueId = email || cpf || phone || name;
        
        if (!uniqueId || uniqueId === 'Desconhecido') return;

        if (!customersMap[uniqueId]) {
          customersMap[uniqueId] = {
            id: btoa(uniqueId).replace(/=/g, '').substring(0, 16),
            originalId: uniqueId,
            name,
            email: email || '-',
            phone: phone || '-',
            cpf: cpf || '-',
            city: order.address?.city || '-',
            state: order.address?.state || '-',
            orders: [],
            totalSpent: 0,
            firstOrderDate: new Date(order.created_at || order.createdAt),
            lastOrderDate: new Date(order.created_at || order.createdAt),
            products: {}
          };
        }

        const customer = customersMap[uniqueId];
        customer.orders.push(order);
        
        if (order.status !== 'cancelado') {
          customer.totalSpent += Number(order.total_amount || order.total || 0);
        }

        const orderDate = new Date(order.created_at || order.createdAt);
        if (orderDate < customer.firstOrderDate) customer.firstOrderDate = orderDate;
        if (orderDate > customer.lastOrderDate) customer.lastOrderDate = orderDate;

        if (Array.isArray(order.items)) {
          order.items.forEach(item => {
            const prodName = item.name || item.title || 'Produto';
            if (!customer.products[prodName]) {
              customer.products[prodName] = {
                name: prodName,
                image: item.image,
                quantity: 0,
                price: item.price
              };
            }
            customer.products[prodName].quantity += Number(item.quantity || 1);
          });
        }
      });

      const now = new Date();

      return Object.values(customersMap).map(customer => {
        customer.orders.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
        
        const validOrders = customer.orders.filter(o => o.status !== 'cancelado');
        customer.totalOrders = validOrders.length;
        customer.averageTicket = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;

        const daysSinceLastOrder = Math.floor((now - customer.lastOrderDate) / (1000 * 60 * 60 * 24));
        
        if (customer.totalOrders === 0) {
          customer.status = 'Novo'; // Only cancelled orders maybe
        } else if (daysSinceLastOrder > 90) {
          customer.status = 'Inativo';
        } else if (customer.totalSpent >= 1000 || customer.totalOrders >= 5) {
          customer.status = 'VIP';
        } else if (customer.totalOrders > 1) {
          customer.status = 'Recorrente';
        } else {
          customer.status = 'Novo';
        }

        customer.insights = [];
        if (customer.status === 'VIP') customer.insights.push('Cliente VIP com alto engajamento.');
        if (customer.status === 'Recorrente') customer.insights.push('Comprador recorrente.');
        if (customer.status === 'Novo' && customer.totalOrders > 0) customer.insights.push('Cliente novo, focar em primeira retenção.');
        if (daysSinceLastOrder > 60 && daysSinceLastOrder <= 90) customer.insights.push(`Sem comprar há ${daysSinceLastOrder} dias (risco de churn).`);
        if (customer.status === 'Inativo') customer.insights.push('Cliente inativo, necessita de campanha de recuperação.');
        if (customer.averageTicket > 300) customer.insights.push('Possui alto ticket médio.');

        customer.favoriteProducts = Object.values(customer.products)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 4);

        return customer;
      }).sort((a, b) => b.totalSpent - a.totalSpent);
    } catch (error) {
      console.error('Erro ao processar clientes:', error);
      return [];
    }
  },

  async getCustomerById(id) {
    const customers = await this.getCustomers();
    return customers.find(c => c.id === id);
  }
};

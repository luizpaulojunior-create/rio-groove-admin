import api from '../lib/api';

/**
 * @typedef {Object} StockItem
 * @property {string} id
 * @property {string} category
 * @property {string} gender
 * @property {string} fabric
 * @property {string} model
 * @property {string} color_key
 * @property {string} color_label
 * @property {string} color_hex
 * @property {string} size
 * @property {number} unit_cost
 * @property {number} quantity
 * @property {number} min_stock
 * @property {string} sku
 * @property {boolean} is_active
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

function normalizeStock(item) {
  if (!item) return null;

  const parseNum = (val, defaultVal = 0) => {
    if (val === undefined || val === null) return defaultVal;
    const num = Number(typeof val === 'string' ? String(val).replace(',', '.') : val);
    return isNaN(num) ? defaultVal : num;
  };

  const quantity = parseNum(item.quantity !== undefined ? item.quantity : item.stock, 0);
  const minStock = parseNum(item.min_stock, 0);
  const unitCost = parseNum(item.unit_cost !== undefined ? item.unit_cost : item.cost, 0);
  const isActive = item.is_active !== undefined ? item.is_active !== false : item.active !== false;

  let status = 'DISPONÍVEL';
  if (!isActive) {
    status = 'INATIVO';
  } else if (quantity <= 0) {
    status = 'ESGOTADO';
  } else if (quantity <= minStock) {
    status = 'BAIXO';
  }

  return {
    id: item.id || '',
    sku: String(item.sku || '').trim().toUpperCase(),
    category: String(item.category || '').trim(),
    gender: String(item.gender || '').trim(),
    fabric: String(item.fabric || '').trim(),
    model: String(item.model || '').trim(),
    color_key: String(item.color_key || '').trim().toLowerCase(),
    color_label: String(item.color_label || '').trim(),
    color_hex: String(item.color_hex || '').trim(),
    size: String(item.size || '').trim(),
    quantity: quantity,
    min_stock: minStock,
    unit_cost: unitCost,
    is_active: isActive,
    status: status,
    updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
    
    // Fallbacks to avoid breaking legacy code temporarily
    stock: quantity,
    cost: unitCost,
    active: isActive
  };
}

const normalizePayload = (data) => {
  const parseNum = (val, defaultVal = 0) => {
    if (val === undefined || val === null || val === '') return defaultVal;
    const num = Number(typeof val === 'string' ? String(val).replace(',', '.') : val);
    return isNaN(num) ? defaultVal : num;
  };

  const payload = {
    category: String(data.category || '').trim(),
    model: String(data.model || '').trim(),
    color_key: String(data.color_key || '').trim().toLowerCase(),
    color_label: String(data.color_label || '').trim(),
    color_hex: String(data.color_hex || '').trim(),
    size: String(data.size || '').trim(),
    sku: String(data.sku || '').trim().toUpperCase(),
    quantity: parseNum(data.quantity !== undefined ? data.quantity : data.stock, 0),
    min_stock: parseNum(data.min_stock, 0),
    unit_cost: parseNum(data.unit_cost !== undefined ? data.unit_cost : data.cost, 0),
    is_active: data.is_active !== undefined ? data.is_active !== false : data.active !== false
  };

  if (data.gender) payload.gender = String(data.gender).trim();
  if (data.fabric) payload.fabric = String(data.fabric).trim();

  return payload;
};

export const stockService = {
  async getStock() {
    try {
      const { data } = await api.get('/stock');
      return Array.isArray(data) ? data.map(normalizeStock) : [];
    } catch (e) {
      console.error('Erro ao buscar estoque:', e);
      return [];
    }
  },

  async getStockItem(id) {
    const { data } = await api.get(`/stock/${id}`);
    return normalizeStock(data);
  },
  async createStockItem(stockData) {
    const { data } = await api.post('/stock', normalizePayload(stockData));
    return normalizeStock(data);
  },
  async updateStockItem(id, stockData) {
    const payload = normalizePayload(stockData);
    console.log('[DEBUG] stock.js updateStockItem Payload para a API:', payload);
    console.log('[DEBUG] Endpoint utilizado:', `/stock/${id}`);
    try {
      const response = await api.put(`/stock/${id}`, payload);
      console.log('[DEBUG] stock.js updateStockItem Response Success:', response.data);
      return normalizeStock(response.data);
    } catch (e) {
      console.error('[DEBUG] stock.js updateStockItem Error Completo:', e);
      console.error('[DEBUG] stock.js updateStockItem Response Error Data:', e.response?.data);
      console.error('[DEBUG] stock.js updateStockItem Response Error Status:', e.response?.status);
      throw e;
    }
  },
  async deleteStockItem(id) {
    await api.delete(`/stock/${id}`);
    return true;
  },
  async adjustStock(id, quantity, reason) {
    const { data } = await api.post(`/stock/${id}/adjust`, { 
      quantity: Number(quantity) || 0, 
      reason: String(reason || '').trim() 
    });
    return normalizeStock(data);
  },
  async seedStockItems() {
    const { data } = await api.post('/stock/seed');
    return data;
  },
  async syncYellowStockItems(quantity = 10) {
    const { data } = await api.post('/stock/sync-yellow', { quantity: Number(quantity) || 10 });
    return data;
  }
};

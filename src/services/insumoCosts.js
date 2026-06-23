import api from '../lib/api';

export const DTF_INSUMOS = ['Camisa', 'Cropped', 'Regata', 'Caneca', 'Boné'];

export { GENERAL_COST_GROUPS, GENERAL_COST_LABELS } from '../config/generalCosts';

export const insumoCostsService = {
  async getConfig() {
    const { data } = await api.get('/insumo-costs');
    return data;
  },

  async getDre(month) {
    const { data } = await api.get('/insumo-costs/dre', { params: { month } });
    return data;
  },

  async saveConfig(config) {
    const { data } = await api.put('/insumo-costs', { config });
    return data;
  },
};

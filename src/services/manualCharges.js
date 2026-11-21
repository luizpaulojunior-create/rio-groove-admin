import api from '../lib/api';

export const manualChargesService = {
  async list() {
    const { data } = await api.get('/charges');
    return data.charges || [];
  },

  async create(payload) {
    const { data } = await api.post('/charges', payload);
    return data.charge;
  },
};

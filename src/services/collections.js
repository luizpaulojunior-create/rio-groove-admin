import api from '../lib/api';

export const collectionsService = {
  async getCollections() {
    const { data } = await api.get('/collections');
    return data;
  },
  async getCollection(id) {
    const { data } = await api.get(`/collections/${id}`);
    return data;
  },
  async createCollection(collectionData) {
    const { data } = await api.post('/collections', collectionData);
    return data;
  },
  async updateCollection(id, collectionData) {
    const { data } = await api.put(`/collections/${id}`, collectionData);
    return data;
  },
  async deleteCollection(id) {
    await api.delete(`/collections/${id}`);
    return true;
  }
};
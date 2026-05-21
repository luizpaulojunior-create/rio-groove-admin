import api from '../lib/api';

const normalizeArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
};

const normalizeProductPayload = (formData) => ({
  ...formData,
  collections: normalizeArrayField(formData.collections),
  images: normalizeArrayField(formData.images)
});

export const productsService = {
  async getProducts() {
    try {
      const { data } = await api.get('/products');
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message || 'Falha ao buscar produtos');
    }
  },

  async getProduct(id) {
    try {
      const { data } = await api.get(`/products/${id}`);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message || 'Falha ao buscar produto');
    }
  },

  async createProduct(formData) {
    const isFormData = formData instanceof FormData;

    if (isFormData) {
      if (formData.has('collections')) {
        const collections = normalizeArrayField(formData.get('collections'));
        formData.delete('collections');
        if (collections.length > 0) {
          collections.forEach(c => formData.append('collections', c));
        } else {
          formData.append('collections', '{}');
        }
      }
      // We purposefully DO NOT stringify 'images' because it contains File objects
    }

    const dataToSend = isFormData ? formData : normalizeProductPayload(formData);

    try {
      const { data } = await api.post('/products', dataToSend);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.response?.data?.message || err.message || 'Falha ao criar produto');
    }
  },

  async updateProduct(id, formData) {
    const isFormData = formData instanceof FormData;

    if (isFormData) {
      if (formData.has('collections')) {
        const collections = normalizeArrayField(formData.get('collections'));
        formData.delete('collections');
        if (collections.length > 0) {
          collections.forEach(c => formData.append('collections', c));
        } else {
          formData.append('collections', '{}');
        }
      }
    }

    const dataToSend = isFormData ? formData : normalizeProductPayload(formData);

    try {
      const { data } = await api.put(`/products/${id}`, dataToSend);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.response?.data?.message || err.message || 'Falha ao atualizar produto');
    }
  },

  async deleteProduct(id) {
    try {
      const { data } = await api.delete(`/products/${id}`);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.response?.data?.message || err.message || 'Falha ao deletar produto');
    }
  }
};

import api from '../lib/api';

const normalizeArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
};

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

  async createProduct(dataObj) {
    const formData = new FormData();
    
    Object.keys(dataObj).forEach(key => {
      if (key !== 'images' && key !== 'collections') {
        formData.append(key, dataObj[key] === null ? '' : dataObj[key]);
      }
    });

    if (dataObj.collections) {
      const collections = normalizeArrayField(dataObj.collections);
      if (collections.length > 0) {
        collections.forEach(c => formData.append('collections', c));
      } else {
        formData.append('collections', '[]');
      }
    }

    if (dataObj.images && Array.isArray(dataObj.images)) {
      dataObj.images.forEach(image => {
        if (image.file instanceof File) {
          formData.append('images', image.file);
        } else if (image.url || image.image_url || image.preview) {
          formData.append('existing_images', JSON.stringify(image));
        }
      });
    }

    try {
      const { data } = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.response?.data?.message || err.message || 'Falha ao criar produto');
    }
  },

  async updateProduct(id, dataObj) {
    const formData = new FormData();
    
    Object.keys(dataObj).forEach(key => {
      if (key !== 'images' && key !== 'collections') {
        formData.append(key, dataObj[key] === null ? '' : dataObj[key]);
      }
    });

    if (dataObj.collections) {
      const collections = normalizeArrayField(dataObj.collections);
      if (collections.length > 0) {
        collections.forEach(c => formData.append('collections', c));
      } else {
        formData.append('collections', '[]');
      }
    }

    if (dataObj.images && Array.isArray(dataObj.images)) {
      dataObj.images.forEach(image => {
        if (image.file instanceof File) {
          formData.append('images', image.file);
        } else if (image.url || image.image_url || image.preview) {
          formData.append('existing_images', JSON.stringify(image));
        }
      });
    }

    try {
      const { data } = await api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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

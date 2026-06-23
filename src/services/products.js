import api from '../lib/api';
import { COLORS } from '../config/inventory';

const normalizeArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
};

function colorKeyToVariantLabel(colorKey) {
  if (!colorKey) return '';
  const match = COLORS.find((c) => c.key === String(colorKey).trim().toLowerCase());
  return match?.label || '';
}

function appendImagesToFormData(formData, images) {
  const newImageMeta = [];

  images.forEach((image, index) => {
    if (image.file instanceof File) {
      formData.append('images', image.file);
      newImageMeta.push({
        color_key: image.color_key || '',
        color_variant: image.color_key ? colorKeyToVariantLabel(image.color_key) : '',
        isMain: Boolean(image.isMain),
        sort_order: image.position ?? index,
      });
    } else if (image.url || image.image_url || image.preview) {
      const colorKey = image.color_key || '';
      formData.append('existing_images', JSON.stringify({
        id: image.id,
        image_url: image.image_url || image.url || image.preview,
        url: image.url || image.image_url || image.preview,
        preview: image.preview || image.image_url || image.url,
        color_key: colorKey,
        color_variant: colorKey ? colorKeyToVariantLabel(colorKey) : (image.color_variant || ''),
        alt_text: image.alt_text || '',
        isMain: Boolean(image.isMain),
        sort_order: image.position ?? image.sort_order ?? index,
        position: image.position ?? image.sort_order ?? index,
      }));
    }
  });

  if (newImageMeta.length > 0) {
    formData.append('new_image_meta', JSON.stringify(newImageMeta));
  }
}

export const productsService = {
  async getProducts() {
    try {
      const { data } = await api.get('/products');
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message || 'Falha ao buscar produtos', { cause: err });
    }
  },

  async getProduct(id) {
    try {
      const { data } = await api.get(`/products/${id}`);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message || 'Falha ao buscar produto', { cause: err });
    }
  },

  async createProduct(dataObj) {
    const images = dataObj.images || [];

    const formData = new FormData();

    Object.keys(dataObj).forEach(key => {
      if (key !== 'images' && key !== 'collections' && key !== 'colors' && key !== 'fabricAppearances' && key !== 'tags') {
        formData.append(key, dataObj[key] === null ? '' : dataObj[key]);
      }
    });

    if (dataObj.fabricAppearances) {
      formData.append('fabric_appearances', JSON.stringify(dataObj.fabricAppearances));
    }

    if (dataObj.collections) {
      const collections = normalizeArrayField(dataObj.collections);
      if (collections.length > 0) {
        collections.forEach(c => formData.append('collections', c));
      } else {
        formData.append('collections', '[]');
      }
    }

    if (dataObj.colors) {
      formData.append('colors', JSON.stringify(dataObj.colors));
    }

    if (dataObj.tags) {
      formData.append('tags', typeof dataObj.tags === 'string' ? dataObj.tags : JSON.stringify(dataObj.tags));
    }

    appendImagesToFormData(formData, images);

    try {
      const { data } = await api.post('/products', formData);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.response?.data?.message || err.message || 'Falha ao criar produto', { cause: err });
    }
  },

  async updateProduct(id, dataObj) {
    const images = dataObj.images;

    const formData = new FormData();

    Object.keys(dataObj).forEach(key => {
      if (key !== 'images' && key !== 'collections' && key !== 'colors' && key !== 'fabricAppearances' && key !== 'tags') {
        formData.append(key, dataObj[key] === null ? '' : dataObj[key]);
      }
    });

    if (dataObj.fabricAppearances) {
      formData.append('fabric_appearances', JSON.stringify(dataObj.fabricAppearances));
    }

    if (dataObj.collections) {
      const collections = normalizeArrayField(dataObj.collections);
      if (collections.length > 0) {
        collections.forEach(c => formData.append('collections', c));
      } else {
        formData.append('collections', '[]');
      }
    }

    if (dataObj.colors) {
      formData.append('colors', JSON.stringify(dataObj.colors));
    }

    if (dataObj.tags) {
      formData.append('tags', typeof dataObj.tags === 'string' ? dataObj.tags : JSON.stringify(dataObj.tags));
    }

    if (images !== undefined) {
      formData.append('images_updated', 'true');
      appendImagesToFormData(formData, images);
    } else {
      formData.append('images_updated', 'false');
    }

    try {
      const { data } = await api.put(`/products/${id}`, formData);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.response?.data?.message || err.message || 'Falha ao atualizar produto', { cause: err });
    }
  },

  async deleteProduct(id) {
    try {
      const { data } = await api.delete(`/products/${id}`);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.response?.data?.message || err.message || 'Falha ao deletar produto', { cause: err });
    }
  }
};

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://rio-groove-backend.onrender.com/api');

export const productsService = {
  async getProducts() {
    const res = await fetch(`${API_URL}/products`).catch(() => {
      throw new Error('Falha de conexão com o servidor. O backend está rodando localmente?');
    });
    if (!res.ok) throw new Error('Falha ao buscar produtos');
    return res.json();
  },

  async getProduct(id) {
    const res = await fetch(`${API_URL}/products/${id}`).catch(() => {
      throw new Error('Falha de conexão com o servidor.');
    });
    if (!res.ok) throw new Error('Falha ao buscar produto');
    return res.json();
  },

  async createProduct(formData) {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      body: formData
    }).catch(() => {
      throw new Error('Falha de conexão. Verifique se o backend está rodando na porta 3000.');
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar produto no servidor');
    }
    return res.json();
  },

  async updateProduct(id, formData) {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      body: formData
    }).catch(() => {
      throw new Error('Falha de conexão. Verifique se o backend está rodando na porta 3000.');
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar produto no servidor');
    }
    return res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE'
    }).catch(() => {
      throw new Error('Falha de conexão com o servidor.');
    });
    if (!res.ok) throw new Error('Falha ao deletar produto no servidor');
    return true;
  }
}

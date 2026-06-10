/**
 * Cliente HTTP oficial do admin para dados operacionais (produtos, pedidos, estoque, coleções).
 * Fonte de dados: rio-groove-backend (ver API_CONTRACTS.md na raiz do projeto).
 * CMS/auth continuam via Supabase direto — ver src/lib/supabase.js e ARCHITECTURE.md.
 */
import axios from 'axios';
import { supabase } from './supabase';

/** Garante sufixo /api mesmo se VITE_API_URL vier sem ele (ex.: Cloudflare env). */
export function resolveApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_URL || 'https://rio-groove-backend.onrender.com/api').trim();
  const withoutTrailing = raw.replace(/\/+$/, '');
  return withoutTrailing.endsWith('/api') ? withoutTrailing : `${withoutTrailing}/api`;
}

/** Raiz do backend sem /api — OAuth Melhor Envio, redirects. */
export function getBackendRootUrl() {
  return resolveApiBaseUrl().replace(/\/api$/, '');
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição: Adicionar Token
api.interceptors.request.use(
  async (config) => {
    // Pegar a sessão atual do Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    // Auto-remove Content-Type para FormData para permitir que o browser adicione o boundary
    if (config.data instanceof FormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta: Tratamento de Erros e Refresh Token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    originalRequest.retryCount = originalRequest.retryCount || 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    // Retry system para erros de rede ou 5xx
    if ((!error.response || error.response.status >= 500) && originalRequest.retryCount < maxRetries && originalRequest.method !== 'post') {
      originalRequest.retryCount += 1;
      console.warn(`[Retry ${originalRequest.retryCount}/${maxRetries}] Retrying request to ${originalRequest.url}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay * originalRequest.retryCount));
      return api(originalRequest);
    }

    if (error.response?.status === 403) {
      console.error('[API Error] Acesso negado (403)', error.response?.data?.message);
      return Promise.reject(error);
    }

    // Se o erro for 401 (Não autorizado) e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tentar atualizar a sessão com Supabase
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !session) {
          await supabase.auth.signOut();
          window.location.href = '/admin/login';
          return Promise.reject(refreshError || error);
        }

        // Atualizar o header de autorização e reenviar a requisição original
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    // Log operacional de erro
    console.error(`[API Error] ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

export default api;

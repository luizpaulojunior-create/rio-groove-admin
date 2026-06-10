import { supabase } from '../lib/supabase';
import { STORAGE_BUCKET, STORAGE_PATHS } from '../config/storage';

const UPLOAD_MAX_ATTEMPTS = 3;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const ALLOWED_STORAGE_PREFIXES = new Set(Object.values(STORAGE_PATHS));

function sanitizeStoragePath(rawPath) {
  const trimmed = String(rawPath || '').trim().replace(/\\/g, '/');
  if (!trimmed || trimmed.includes('..') || trimmed.startsWith('/') || /[\0%]/.test(trimmed)) {
    throw new Error('Caminho de upload inválido.');
  }
  const normalized = trimmed.replace(/\/+/g, '/').replace(/\/$/, '');
  const allowed = [...ALLOWED_STORAGE_PREFIXES].some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
  if (!allowed) {
    throw new Error('Pasta de upload não permitida.');
  }
  return normalized;
}

function assertUploadFile(file) {
  if (!file || !ALLOWED_MIME.has(file.type)) {
    throw new Error('Formato inválido. Use JPG, PNG, WebP ou GIF.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Arquivo muito grande. O limite é 20 MB.');
  }
}

function isTransientUploadError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    error?.name === 'StorageUnknownError'
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const storageService = {
  async uploadFile(file, path) {
    assertUploadFile(file);
    const safePath = sanitizeStoragePath(path);
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${safePath}/${fileName}`;

    let lastError = null;

    for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt += 1) {
      try {
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      } catch (error) {
        lastError = error;
        if (!isTransientUploadError(error) || attempt === UPLOAD_MAX_ATTEMPTS) {
          throw error;
        }
        await sleep(800 * attempt);
      }
    }

    throw lastError;
  },

  async deleteProductImage(pathOrUrl) {
    if (!pathOrUrl) return false;

    try {
      let path = pathOrUrl;
      if (pathOrUrl.includes(`/${STORAGE_BUCKET}/`)) {
        path = pathOrUrl.split(`/${STORAGE_BUCKET}/`)[1];
      }

      const safePath = sanitizeStoragePath(path);

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([safePath]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting image:', err);
      return false;
    }
  },
};

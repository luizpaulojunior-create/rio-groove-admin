import api from '../lib/api'
import { supabase } from '../lib/supabase'
import { STORAGE_BUCKET, STORAGE_PATHS } from '../config/storage'

export const storageService = {
  async uploadFile(file, path) {
    console.log('UPLOAD INITIATED', { file, path, STORAGE_BUCKET });
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('SUPABASE UPLOAD ERROR:', error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      console.log('UPLOAD SUCCESS URL:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('UPLOAD ERROR:', err);
      throw new Error(err.message || 'Falha ao fazer upload direto no Supabase');
    }
  },

  async deleteProductImage(pathOrUrl) {
    if (!pathOrUrl) return

    try {
      // If it's a full URL, extract the path
      let path = pathOrUrl
      if (pathOrUrl.includes(`/${STORAGE_BUCKET}/`)) {
        path = pathOrUrl.split(`/${STORAGE_BUCKET}/`)[1]
      }

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path])

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error deleting image:', err)
      return false
    }
  }
}

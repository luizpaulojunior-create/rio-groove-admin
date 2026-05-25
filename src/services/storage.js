import { supabase } from '../lib/supabase';
import { STORAGE_BUCKET } from '../config/storage';

export const storageService = {
  async uploadFile(file, path) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  },

  async deleteProductImage(pathOrUrl) {
    if (!pathOrUrl) return false;

    try {
      let path = pathOrUrl;
      if (pathOrUrl.includes(`/${STORAGE_BUCKET}/`)) {
        path = pathOrUrl.split(`/${STORAGE_BUCKET}/`)[1];
      }

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting image:', err);
      return false;
    }
  },
};

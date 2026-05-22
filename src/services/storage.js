import api from '../lib/api'
import { supabase } from '../lib/supabase'
import { STORAGE_BUCKET, STORAGE_PATHS } from '../config/storage'

export const storageService = {
  async uploadFile(file, path) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', STORAGE_BUCKET)
    if (path) {
      formData.append('path', path)
    }

    try {
      const { data } = await api.post('/upload', formData)
      return data.url
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message || 'Falha ao fazer upload')
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

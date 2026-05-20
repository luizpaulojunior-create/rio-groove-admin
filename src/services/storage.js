import { supabase } from '../lib/supabase'

export const storageService = {
  async deleteProductImage(pathOrUrl) {
    if (!pathOrUrl) return

    try {
      // If it's a full URL, extract the path
      let path = pathOrUrl
      if (pathOrUrl.includes('/product-images/')) {
        path = pathOrUrl.split('/product-images/')[1]
      }

      const { error } = await supabase.storage
        .from('product-images')
        .remove([path])

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error deleting image:', err)
      return false
    }
  }
}

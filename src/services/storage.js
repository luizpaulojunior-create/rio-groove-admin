import { supabase } from '../lib/supabase'

export const storageService = {
  async uploadProductImage(file) {
    if (!file) return null

    // Create a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return {
      url: data.publicUrl,
      path: filePath
    }
  },

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

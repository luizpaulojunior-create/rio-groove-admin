const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cvpobvvkhcqasumhfwps.supabase.co';

export const normalizeImageUrl = (url) => {
  if (!url) return '';

  // Handle object inputs (like image objects from DB)
  if (typeof url === 'object') {
    url = url.url || url.image_url || url.preview || '';
    if (!url) return '';
  }

  // If it's already a supabase URL, data URI, or blob, return it
  if (url.includes('supabase.co') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  return url;
};

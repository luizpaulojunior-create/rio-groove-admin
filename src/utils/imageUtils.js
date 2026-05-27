const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

export const convertToWebP = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob failed'));
            return;
          }
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(newFile);
        }, 'image/webp', quality);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

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

/** Preview/thumbnail via Supabase render/image quando aplicável. */
export const optimizeImageUrl = (url, options = {}) => {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return '';

  const objectPrefix = '/storage/v1/object/public/';
  if (!normalized.includes('supabase.co') || !normalized.includes(objectPrefix)) {
    return normalized;
  }

  const width = options.width ?? 960;
  const quality = options.quality ?? 80;
  const transformed = normalized.replace(objectPrefix, '/storage/v1/render/image/public/');
  return `${transformed}?width=${width}&quality=${quality}&format=webp`;
};

/**
 * Bucket oficial para novos uploads (backend + admin CMS).
 * Legado: URLs existentes podem apontar para bucket `products/` — não migrar na Fase 3.
 */
export const STORAGE_BUCKET = 'product-images';

export const STORAGE_PATHS = {
  HERO: 'storefront/hero',
  HEADER: 'storefront/header',
  BRANDING: 'storefront/branding',
  BANNERS: 'storefront/banners',
  EDITORIAL: 'storefront/editorial',
  CAMPAIGNS: 'campaigns',
  COLLECTIONS: 'collections',
  PRODUCTS: 'products',
};

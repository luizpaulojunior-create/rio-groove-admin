import { CATALOG_SLUGS } from './productCatalog';

/** Temas editoriais (campo `category` em products) — valores reais do Supabase. */
export const PRODUCT_CATEGORIES = [
  'Samba & Cultura Brasileira',
  'Malandragem & Rua',
  'Rainhas & Poder Feminino',
  'Ancestralidade Brasileira',
  'Luz & Proteção',
  'Camisas',
];

/** Slugs de segmento na loja (Feminino > Cropped, etc.) — persistidos em tags `segmento:`. */
export const PRODUCT_CATALOG_SLUGS = CATALOG_SLUGS;

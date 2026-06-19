/**
 * Mapeamento admin → vitrine (coleção, gênero, modelo, segmento/slug).
 * Alinhado com rio-groove-store-v2/src/utils/productCatalog.ts
 */

export const INSUMO_CATEGORY_CROPPED = 'Cropped';

/** Modelos cropped femininos — estoque e cadastro de produto. */
export const CROPPED_MODELS = ['Cropped Oversized'];

/** Opções do select "Categoria do insumo" no cadastro de produto. */
export const PRODUCT_FORM_INSUMO_CATEGORIES = [
  'Camisa',
  INSUMO_CATEGORY_CROPPED,
  'Regata',
  'Boné',
  'Caneca',
];

export const CATALOG_SLUGS = [
  { slug: 'regatas', label: 'Regatas' },
  { slug: 'oversized', label: 'Oversized' },
  { slug: 'tradicional', label: 'Tradicional' },
  { slug: 'baby-look', label: 'Baby Look' },
  { slug: 'cropped', label: 'Cropped' },
  { slug: 'tops', label: 'Tops' },
];

export function isCroppedInsumoCategory(category) {
  return String(category || '').trim() === INSUMO_CATEGORY_CROPPED;
}

/** Categoria exibida no form a partir das tags salvas. */
export function resolveInsumoFormCategory(tags, insumo, model, genero) {
  const segment = parseSegmentFromTags(tags);
  if (segment === 'cropped' || isCroppedInsumoCategory(insumo)) {
    return INSUMO_CATEGORY_CROPPED;
  }
  if (
    String(insumo || '').trim() === 'Camisa'
    && String(genero || '').trim() === 'Feminino'
    && CROPPED_MODELS.includes(String(model || '').trim())
  ) {
    return INSUMO_CATEGORY_CROPPED;
  }
  return insumo || 'Camisa';
}

/** Categoria persistida no estoque/tags (Cropped → Camisa). */
export function resolveStockInsumo(formCategory) {
  return isCroppedInsumoCategory(formCategory) ? 'Camisa' : formCategory;
}

/** Temas editoriais (campo products.category) — espelha productCategories.js */
export const COLLECTION_THEME_NAMES = [
  'Samba & Cultura Brasileira',
  'Malandragem & Rua',
  'Rainhas & Poder Feminino',
  'Ancestralidade Brasileira',
  'Luz & Proteção',
  'Camisas',
];

export function parseSegmentFromTags(tags) {
  const list = Array.isArray(tags) ? tags : [];
  for (const tag of list) {
    if (typeof tag === 'string' && tag.startsWith('segmento:')) {
      return tag.slice('segmento:'.length).trim().toLowerCase();
    }
  }
  return '';
}

export function resolveSegmentFromInsumo(insumo, model, gender) {
  const ins = String(insumo || '').trim();
  const m = String(model || '').trim();
  const g = String(gender || '').trim();

  if (isCroppedInsumoCategory(ins)) return 'cropped';
  if (ins === 'Regata') return 'regatas';
  if (m === 'Baby Tee Altíssima') return 'baby-look';
  if (m === 'Regata Cropped Boxy') return 'tops';
  if (/cropped/i.test(m)) return 'cropped';
  if (/oversized/i.test(m)) return 'oversized';
  if (['Cropped Tradicional', 'Relaxed Fit', 'Regular Fit', 'Oversized Tradicional'].includes(m)) {
    if (g === 'Feminino' && m === 'Cropped Tradicional') return 'cropped';
    return 'tradicional';
  }
  return '';
}

/** Campo products.category — espelha a coleção quando houver vínculo. */
export function resolveThemeFromCollection(collection) {
  if (!collection?.name) return '';
  const name = String(collection.name).trim();
  const match = COLLECTION_THEME_NAMES.find(
    (theme) => theme.toLowerCase() === name.toLowerCase()
  );
  return match || name;
}

export function resolveProductCategory({ collection, fallbackCategory = '' } = {}) {
  const fromCollection = resolveThemeFromCollection(collection);
  if (fromCollection) return fromCollection;
  return String(fallbackCategory || '').trim();
}

export function findCollectionForTheme(collections, themeName) {
  if (!themeName || !Array.isArray(collections)) return null;
  const norm = String(themeName).trim().toLowerCase();
  return collections.find((c) => String(c.name || '').trim().toLowerCase() === norm) || null;
}

export function buildStorePreviewUrls({ collectionSlug, catalogSlug, gender }) {
  const urls = [];
  if (collectionSlug) {
    urls.push({ label: 'Coleção', url: `/collections/${collectionSlug}` });
  }
  if (catalogSlug && gender) {
    const genero = gender === 'Feminino' ? 'feminino' : 'masculino';
    urls.push({
      label: 'Catálogo',
      url: `/products?genero=${genero}&segmento=${catalogSlug}`,
    });
  } else if (catalogSlug) {
    urls.push({ label: 'Catálogo', url: `/products?segmento=${catalogSlug}` });
  } else if (gender) {
    const genero = gender === 'Feminino' ? 'feminino' : 'masculino';
    urls.push({ label: 'Catálogo', url: `/products?genero=${genero}` });
  }
  return urls;
}

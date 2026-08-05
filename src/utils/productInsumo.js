import { normalizeProductTags } from './normalizeProductTags';

const DEFAULT_INSUMO_CATEGORY = 'Camisa';
const DEFAULT_INSUMO_MODEL = 'Oversized Tradicional';

const FEMININE_CROPPED_OVERSIZED_ALIASES = new Set([
  'Oversized Feminina',
  'Boxy Cropped',
  'Cropped Tradicional',
  'Cropped Oversized',
]);

function parseTags(tags) {
  return normalizeProductTags(tags);
}

export function getProductInsumoCategory(product) {
  if (!product) return DEFAULT_INSUMO_CATEGORY;
  for (const tag of parseTags(product.tags)) {
    if (tag.startsWith('insumo:')) {
      return tag.slice('insumo:'.length).trim() || DEFAULT_INSUMO_CATEGORY;
    }
  }
  return DEFAULT_INSUMO_CATEGORY;
}

export function getProductInsumoModel(product) {
  if (!product) return DEFAULT_INSUMO_MODEL;
  for (const tag of parseTags(product.tags)) {
    if (tag.startsWith('model:')) {
      return tag.slice('model:'.length).trim() || DEFAULT_INSUMO_MODEL;
    }
  }
  return DEFAULT_INSUMO_MODEL;
}

export function getProductGender(product) {
  for (const tag of parseTags(product?.tags)) {
    if (tag.startsWith('genero:')) {
      const value = tag.slice('genero:'.length).trim();
      if (value === 'Masculino' || value === 'Feminino') return value;
    }
  }
  return null;
}

/** Categoria usada em stock_items (Cropped comercial → Camisa). */
export function getProductStockCategory(product) {
  const insumo = getProductInsumoCategory(product);
  if (insumo === 'Cropped') return 'Camisa';
  return insumo;
}

/** Modelo usado em stock_items (aliases legados → Cropped Oversized). */
export function getProductStockModel(product) {
  const model = getProductInsumoModel(product);
  const gender = getProductGender(product);
  const insumo = getProductInsumoCategory(product);

  if (
    gender === 'Feminino'
    && (insumo === 'Cropped' || FEMININE_CROPPED_OVERSIZED_ALIASES.has(model))
  ) {
    return 'Cropped Oversized';
  }

  return model;
}

function parseFabricAppearances(raw) {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return raw;
}

export function getProductStockFabrics(product) {
  const raw = parseFabricAppearances(product?.fabric_appearances);
  if (!Array.isArray(raw) || raw.length === 0) return ['Lisa'];
  const mapped = raw.map((f) => {
    const n = String(f).trim().toLowerCase();
    if (n === 'estonado' || n === 'estonada') return 'Estonada';
    return 'Lisa';
  });
  return [...new Set(mapped)];
}

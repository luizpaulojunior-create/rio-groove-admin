import { COLORS, MASCULINO_OVERSIZED_XGG_SURCHARGE } from '../config/inventory';
import {
  getProductGender,
  getProductInsumoModel,
  getProductStockCategory,
  getProductStockFabrics,
  getProductStockModel,
} from './productInsumo';

const COLOR_ALIASES = {
  preto: ['preto', 'preta', 'black', 'blk'],
  black: ['preto', 'preta', 'black', 'blk'],
  blk: ['preto', 'preta', 'black', 'blk'],
  branco: ['branco', 'white', 'wht'],
  white: ['branco', 'white', 'wht'],
  'off white': ['off white', 'offwhite', 'off'],
  offwhite: ['off white', 'offwhite', 'off'],
  off: ['off white', 'offwhite', 'off'],
};

function normalizeLabel(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseProductColors(product) {
  let colors = product?.colors;
  if (typeof colors === 'string') {
    try {
      colors = JSON.parse(colors);
    } catch {
      colors = colors.split(',').map((c) => c.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(colors)) return [];
  return colors
    .map((c) => (c === 'offWhite' ? 'Off White' : String(c || '').trim()))
    .filter(Boolean);
}

export function resolveColorKey(label) {
  const norm = normalizeLabel(label);
  if (!norm) return null;

  const fromCatalog = COLORS.find(
    (c) => normalizeLabel(c.label) === norm || normalizeLabel(c.key) === norm,
  );
  if (fromCatalog) return fromCatalog.key;

  for (const [canonical, aliases] of Object.entries(COLOR_ALIASES)) {
    if (!aliases.includes(norm)) continue;
    const match = COLORS.find(
      (c) => aliases.includes(normalizeLabel(c.label)) || aliases.includes(normalizeLabel(c.key)),
    );
    if (match) return match.key;
    const byCanonical = COLORS.find((c) => normalizeLabel(c.key) === canonical || normalizeLabel(c.label) === canonical);
    if (byCanonical) return byCanonical.key;
  }

  return null;
}

export function getColorMeta(labelOrKey) {
  const key = resolveColorKey(labelOrKey) || normalizeLabel(labelOrKey);
  return COLORS.find((c) => c.key === key) || {
    key,
    label: labelOrKey,
    hex: '#888888',
  };
}

function genderMatches(stockGender, productGender, category) {
  if (category === 'Regata' || category === 'Boné' || category === 'Caneca') return true;
  if (!productGender) return true;
  const g = String(stockGender || '').trim();
  if (!g || g === 'Unissex') return true;
  return g === productGender;
}

export function findBlankStockItems(product, stockItems = [], colorLabel) {
  if (!product) return [];
  const category = getProductStockCategory(product);
  const model = getProductStockModel(product);
  const fabrics = getProductStockFabrics(product);
  const gender = getProductGender(product);
  const colorKey = resolveColorKey(colorLabel);

  return (stockItems || []).filter((row) => {
    if (row.is_active === false) return false;
    if (String(row.category || '').trim() !== category) return false;
    if (String(row.model || '').trim() !== model) return false;
    if (fabrics.length && !fabrics.includes(String(row.fabric || 'Lisa').trim())) return false;
    if (!genderMatches(row.gender, gender, category)) return false;
    if (colorKey) {
      return String(row.color_key || '').toLowerCase() === colorKey;
    }
    return true;
  });
}

export function findBlankForSize(product, stockItems, colorLabel, size) {
  const sizeNorm = String(size || '').trim().toUpperCase();
  return findBlankStockItems(product, stockItems, colorLabel).find(
    (row) => String(row.size || '').trim().toUpperCase() === sizeNorm,
  ) || null;
}

export function resolveUnitPrice(product, size) {
  const base = Number(product?.promotional_price || product?.promotionalPrice || product?.price || 0);
  const gender = getProductGender(product);
  const model = getProductInsumoModel(product);
  const sizeNorm = String(size || '').trim().toUpperCase();
  if (
    gender === 'Masculino'
    && model === 'Oversized Tradicional'
    && (sizeNorm === 'XGG' || sizeNorm === 'G1' || sizeNorm === 'XG')
  ) {
    return base + MASCULINO_OVERSIZED_XGG_SURCHARGE;
  }
  return base;
}

export function productImageUrl(product) {
  if (!product) return null;
  if (product.image_url) return product.image_url;
  const images = product.product_images || product.images;
  if (Array.isArray(images) && images.length) {
    const first = images[0];
    return typeof first === 'string' ? first : (first.image_url || first.url || first.preview || null);
  }
  return null;
}

export function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

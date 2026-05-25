/**
 * Referência central de estoque/catálogo — fonte única operacional.
 * Manter alinhado com rio-groove-backend/src/config/inventory.js
 */
export const CATEGORIES = [
  'Camisa',
  'Regata',
  'Boné',
  'Caneca',
  'Acessório'
];

export const GENDERS = [
  'Masculino',
  'Feminino'
];

/** Persistido quando a categoria não usa gênero (coluna NOT NULL no DB). */
export const GENDER_NEUTRAL = 'Unissex';

/** Persistido quando a categoria não usa malha (coluna NOT NULL no DB). */
export const FABRIC_NEUTRAL = 'N/A';

export const MODELS_BY_GENDER = {
  'Masculino': [
    'Oversized Boxy',
    'Relaxed Fit',
    'Regular Fit',
    'Oversized Tradicional'
  ],
  'Feminino': [
    'Baby Tee Altíssima',
    'Oversized Feminina',
    'Boxy Cropped',
    'Relaxed Fit',
    'Cropped Tradicional',
    'Regata Cropped Boxy'
  ]
};

export const MODELS_REGATA = ['Regular', 'Machão'];
export const MODELS_BONE = ['Trucker', 'Dad Hat', 'Snapback'];
export const MODEL_CANECA = '330ml';

export const FABRICS = [
  'Lisa',
  'Estonada'
];

export const APPAREL_SIZES = ['P', 'M', 'G', 'GG', 'XGG'];

export const SIZES = [
  ...APPAREL_SIZES,
  'Tamanho Único'
];

export const COLORS = [
  { label: 'Black', key: 'blk', hex: '#000000' },
  { label: 'Off White', key: 'off', hex: '#F5F1E8' },
  { label: 'White', key: 'wht', hex: '#FFFFFF' },
  { label: 'Verde', key: 'grn', hex: '#2D5016' },
  { label: 'Vermelho', key: 'red', hex: '#8B0000' }
];

const MODEL_PREFIXES = {
  'Oversized Boxy': 'OVR',
  'Regular Fit': 'REG',
  'Oversized Tradicional': 'OVT',
  'Baby Tee Altíssima': 'BTA',
  'Oversized Feminina': 'OVF',
  'Boxy Cropped': 'BOX',
  'Cropped Tradicional': 'CRO',
  'Regata Cropped Boxy': 'RCB',
  'Regular': 'RGT',
  'Machão': 'MCH',
  'Trucker': 'TRK',
  'Dad Hat': 'DAD',
  'Snapback': 'SNP',
  '330ml': '330'
};

const RELAXED_FIT_PREFIX_BY_GENDER = {
  'Masculino': 'RLM',
  'Feminino': 'RLF'
};

const CATEGORY_PREFIXES = {
  'Camisa': 'CAM',
  'Regata': 'RGT',
  'Boné': 'CAP',
  'Caneca': 'MUG',
  'Acessório': 'ACC'
};

export const UNIT_COST_BY_CATEGORY = {
  'Camisa': 42,
  'Regata': 25,
  'Boné': 25,
  'Caneca': 10,
  'Acessório': 42
};

export function normalizeCategory(category) {
  if (category === 'Camiseta') return 'Camisa';
  return category;
}

export function categoryUsesGender(category) {
  const cat = normalizeCategory(category);
  return cat === 'Camisa' || cat === 'Acessório';
}

export function categoryUsesFabric(category) {
  const cat = normalizeCategory(category);
  return cat === 'Camisa' || cat === 'Regata' || cat === 'Acessório';
}

export function getModelsForCategory(category, gender) {
  const cat = normalizeCategory(category);
  if (cat === 'Camisa' || cat === 'Acessório') {
    return MODELS_BY_GENDER[gender] || [];
  }
  if (cat === 'Regata') return MODELS_REGATA;
  if (cat === 'Boné') return MODELS_BONE;
  if (cat === 'Caneca') return [MODEL_CANECA];
  return [];
}

export function getColorsForCategory(category) {
  const cat = normalizeCategory(category);
  if (cat === 'Caneca') {
    return COLORS.filter((c) => c.key === 'wht');
  }
  return COLORS;
}

export function getSizesForCategory(category) {
  const cat = normalizeCategory(category);
  if (cat === 'Camisa' || cat === 'Regata') return APPAREL_SIZES;
  return ['Tamanho Único'];
}

export function getModelPrefix(model, gender) {
  if (model === 'Relaxed Fit' && gender && RELAXED_FIT_PREFIX_BY_GENDER[gender]) {
    return RELAXED_FIT_PREFIX_BY_GENDER[gender];
  }
  return MODEL_PREFIXES[model] || null;
}

export const generateSKU = (category, model, colorKey, size, fabric, gender) => {
  const cat = normalizeCategory(category);

  if (cat === 'Caneca') {
    return `MUG-330-${String(colorKey || 'wht').toUpperCase()}-U`;
  }

  if (cat === 'Boné') {
    const prefix = getModelPrefix(model, null);
    return [prefix, String(colorKey).toUpperCase(), 'U'].filter(Boolean).join('-');
  }

  if (cat === 'Acessório') {
    const parts = ['ACC'];
    const modelPrefix = getModelPrefix(model, gender);
    if (modelPrefix) parts.push(modelPrefix);
    if (colorKey) parts.push(String(colorKey).toUpperCase());
    parts.push('U');
    if (fabric) parts.push(fabric === 'Estonada' ? 'EST' : 'LS');
    return parts.join('-');
  }

  const parts = [];
  const modelPrefix = getModelPrefix(model, gender);

  if (modelPrefix) {
    parts.push(modelPrefix);
  } else if (CATEGORY_PREFIXES[cat]) {
    parts.push(CATEGORY_PREFIXES[cat]);
  } else if (model) {
    parts.push(model.substring(0, 3).toUpperCase());
  } else {
    parts.push('SKU');
  }

  if (colorKey) {
    parts.push(String(colorKey).toUpperCase());
  }

  if (size) {
    const sizeStr = size === 'Tamanho Único' ? 'U' : size;
    parts.push(String(sizeStr).toUpperCase());
  }

  if (fabric && categoryUsesFabric(cat)) {
    parts.push(fabric === 'Estonada' ? 'EST' : 'LS');
  }

  return parts.join('-');
};

export function getAllModelsForFilters() {
  const models = new Set();
  Object.values(MODELS_BY_GENDER).forEach((list) => list.forEach((m) => models.add(m)));
  MODELS_REGATA.forEach((m) => models.add(m));
  MODELS_BONE.forEach((m) => models.add(m));
  models.add(MODEL_CANECA);
  return Array.from(models).sort();
}

export function resolveGenderFromModel(model, storedGender) {
  if (storedGender) return storedGender;
  for (const [gender, models] of Object.entries(MODELS_BY_GENDER)) {
    if (models.includes(model)) return gender;
  }
  return '';
}

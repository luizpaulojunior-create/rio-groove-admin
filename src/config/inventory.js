/**
 * Referência central de estoque/catálogo — Fase 4.
 * Usado por Stock.jsx, ProductForm.jsx e fluxos operacionais admin.
 */
export const CATEGORIES = [
  'Camisa',
  'Camiseta',
  'Boné',
  'Caneca',
  'Acessório'
];

export const GENDERS = [
  'Masculino',
  'Feminino'
];

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

export const FABRICS = [
  'Lisa',
  'Estonada'
];

export const SIZES = [
  'P',
  'M',
  'G',
  'GG',
  'XGG',
  'Tamanho Único'
];

export const COLORS = [
  { label: 'Black', key: 'blk', hex: '#000000' },
  { label: 'Off White', key: 'off', hex: '#F5F1E8' },
  { label: 'White', key: 'wht', hex: '#FFFFFF' },
  { label: 'Chumbo', key: 'chb', hex: '#36454F' },
  { label: 'Navy', key: 'nvy', hex: '#1B1F3B' },
  { label: 'Verde Militar', key: 'vdm', hex: '#4B5320' },
  { label: 'Bege Areia', key: 'bga', hex: '#D8C3A5' },
  { label: 'Vermelho Escuro', key: 'vme', hex: '#6E0B14' }
];

const MODEL_PREFIXES = {
  'Oversized Boxy': 'OVR',
  'Relaxed Fit': 'REL',
  'Regular Fit': 'REG',
  'Oversized Tradicional': 'OVT',
  'Baby Tee Altíssima': 'BTA',
  'Oversized Feminina': 'OVF',
  'Boxy Cropped': 'BOX',
  'Cropped Tradicional': 'CRO',
  'Regata Cropped Boxy': 'RCB'
};

const CATEGORY_PREFIXES = {
  'Camisa': 'CAM',
  'Camiseta': 'TSH',
  'Boné': 'CAP',
  'Caneca': 'MUG',
  'Acessório': 'ACC'
};

export const generateSKU = (category, model, colorKey, size, fabric) => {
  let parts = [];
  
  if (model && MODEL_PREFIXES[model]) {
    parts.push(MODEL_PREFIXES[model]);
  } else if (category && CATEGORY_PREFIXES[category]) {
    parts.push(CATEGORY_PREFIXES[category]);
  } else if (model) {
    parts.push(model.substring(0, 3).toUpperCase());
  } else {
    parts.push('SKU');
  }

  if (colorKey) {
    parts.push(colorKey.toUpperCase());
  }

  if (size) {
    let sizeStr = size === 'Tamanho Único' ? 'U' : size;
    parts.push(sizeStr.toUpperCase());
  }

  if (fabric) {
    parts.push(fabric === 'Estonada' ? 'EST' : 'LS');
  }

  return parts.join('-');
};

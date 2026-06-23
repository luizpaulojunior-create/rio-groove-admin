/** Preços fixos — espelha o backend (personalizados). */

export const READY_ART_DISCOUNT = 20;

export const EXCLUSIVE_ART_FEE = {
  Camisa: 79.9,
  Cropped: 79.9,
  Regata: 79.9,
  Caneca: 49.9,
  Boné: 39.9,
};

export const PRINTED_PRODUCT_PRICE = {
  Camisa: 99.9,
  Cropped: 39.9,
  Regata: 39.9,
  Boné: 29.9,
  Caneca: 29.9,
};

export function resolvePricingInsumo(order) {
  if (order?.insumo === 'Camisa' && String(order?.segmento || '').toLowerCase() === 'cropped') {
    return 'Cropped';
  }
  if (order?.segmento === 'cropped') return 'Cropped';
  return order?.insumo || '';
}

export function getExclusiveArtPackageTotal(insumo) {
  const art = EXCLUSIVE_ART_FEE[insumo];
  const product = PRINTED_PRODUCT_PRICE[insumo];
  if (art == null || product == null) return null;
  return Math.round((art + product) * 100) / 100;
}

export function getReadyArtProductPrice(insumo) {
  const total = getExclusiveArtPackageTotal(insumo);
  if (total == null) return null;
  return Math.round((total - READY_ART_DISCOUNT) * 100) / 100;
}

/** Valores para exibição — usa colunas do pedido ou tabela fixa (legado). */
export function getOrderDisplayPricing(order) {
  const insumo = resolvePricingInsumo(order);
  let artFee = order?.art_fee_amount != null ? Number(order.art_fee_amount) : null;
  let productUnit = order?.product_unit_amount != null ? Number(order.product_unit_amount) : null;

  if (order?.order_type === 'exclusive_art') {
    if (artFee == null) artFee = EXCLUSIVE_ART_FEE[insumo] ?? null;
    if (productUnit == null) productUnit = PRINTED_PRODUCT_PRICE[insumo] ?? null;
  } else if (order?.order_type === 'ready_art') {
    artFee = 0;
    if (productUnit == null) productUnit = getReadyArtProductPrice(insumo);
    if (productUnit == null && order?.quote_amount != null) {
      productUnit = Number(order.quote_amount);
    }
  }

  const qty = Math.max(1, Number(order?.quantity) || 1);
  const shipping = Number(order?.shipping_amount) || 0;
  const productTotal = productUnit != null
    ? Math.round((productUnit * qty + shipping) * 100) / 100
    : null;

  return { insumo, artFee, productUnit, productTotal };
}

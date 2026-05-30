function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Monta rascunho para duplicar estampa: copia textos/preço/categoria/coleção/tags,
 * limpa imagens, variantes e IDs. Slug único com sufixo -copia.
 */
export function buildDuplicateProductDraft(product) {
  if (!product) return null;

  const baseSlug = slugify(product.slug || product.name || 'produto');
  const stamp = Date.now().toString(36).slice(-5);
  const slug = `${baseSlug}-copia-${stamp}`.slice(0, 180);

  const nameBase = String(product.name || 'Produto').trim();
  const name = nameBase.endsWith('(Cópia)') ? `${nameBase} ${stamp}` : `${nameBase} (Cópia)`;

  return {
    name,
    slug,
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    collection_id: product.collection_id || product.collections?.id || '',
    category: product.category || '',
    price: product.price != null ? String(product.price) : '',
    meta_title: product.meta_title || '',
    meta_description: product.meta_description || '',
    seo_keywords: product.seo_keywords || '',
    og_image: product.og_image || '',
    tags: product.tags,
    colors: product.colors,
    fabric_appearances: product.fabric_appearances || product.fabricAppearances,
    product_images: [],
    images: [],
    product_variants: [],
    variants: [],
  };
}

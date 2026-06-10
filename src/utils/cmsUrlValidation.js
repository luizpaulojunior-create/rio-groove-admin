const INTERNAL_PATH = /^\/[a-zA-Z0-9/_\-.?=&%]*$/;
const SAFE_HTTPS = /^https:\/\/[a-zA-Z0-9.-]+(\/.*)?$/;

export function sanitizeCmsLink(value, fallback = '/') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  if (raw.startsWith('/') && !raw.startsWith('//') && INTERNAL_PATH.test(raw)) {
    return raw;
  }
  if (SAFE_HTTPS.test(raw) && !raw.toLowerCase().startsWith('javascript:')) {
    return raw;
  }
  return fallback;
}

const LINK_KEY = /(^link$|_link$|_url$|^url$|cta_link|href|image_url|banner_url|og_image)/i;

export function sanitizeCmsContent(content) {
  if (content == null) return content;
  if (Array.isArray(content)) return content.map(sanitizeCmsContent);
  if (typeof content !== 'object') return content;

  const out = {};
  for (const [key, value] of Object.entries(content)) {
    if (typeof value === 'string' && LINK_KEY.test(key)) {
      const trimmed = value.trim();
      if (trimmed.startsWith('/') || trimmed.startsWith('http')) {
        out[key] = sanitizeCmsLink(value, trimmed.startsWith('http') ? '' : '/');
        continue;
      }
    }
    if (typeof value === 'object') {
      out[key] = sanitizeCmsContent(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function sanitizeNavigationItems(items) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => ({
    ...item,
    link: sanitizeCmsLink(item.link, '/'),
    editorialCtaLink: item.editorialCtaLink
      ? sanitizeCmsLink(item.editorialCtaLink, sanitizeCmsLink(item.link, '/'))
      : '',
    editorialText: String(item.editorialText ?? ''),
    editorialCtaText: String(item.editorialCtaText ?? ''),
    subItems: Array.isArray(item.subItems)
      ? item.subItems.map((sub) => ({
          ...sub,
          link: sanitizeCmsLink(sub.link, '/'),
        }))
      : [],
  }));
}

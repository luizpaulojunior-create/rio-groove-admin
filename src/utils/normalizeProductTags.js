/** Normaliza tags corrompidas (JSON duplo no array Postgres). */
export function normalizeProductTags(tags) {
  const fallback = ['insumo:Camisa', 'model:Oversized Tradicional', 'genero:Masculino'];
  if (!tags) return [...fallback];

  let raw = tags;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [raw].filter(Boolean);
    }
  }

  if (!Array.isArray(raw)) return [...fallback];

  const flat = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('[')) {
      try {
        const inner = JSON.parse(trimmed);
        if (Array.isArray(inner)) {
          flat.push(...inner.map(String));
          continue;
        }
      } catch {
        // fall through
      }
    }
    flat.push(trimmed);
  }

  return flat.length ? flat : [...fallback];
}

export const ADMIN_ROLES = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
  SUPERADMIN: 'superadmin',
};

const ROLE_RANK = {
  viewer: 1,
  editor: 2,
  superadmin: 3,
};

/** @param {string | null | undefined} userRole */
export function hasMinRole(userRole, minRole) {
  const current = ROLE_RANK[userRole] || ROLE_RANK.viewer;
  const required = ROLE_RANK[minRole] || ROLE_RANK.superadmin;
  return current >= required;
}

/** Rotas que exigem papel mínimo (prefix match). */
export const ROUTE_MIN_ROLES = {
  '/admin/settings': ADMIN_ROLES.SUPERADMIN,
  '/admin/stock': ADMIN_ROLES.EDITOR,
  '/admin/fair-pos': ADMIN_ROLES.EDITOR,
  '/admin/insumo-costs': ADMIN_ROLES.EDITOR,
  '/admin/products': ADMIN_ROLES.EDITOR,
  '/admin/orders': ADMIN_ROLES.EDITOR,
  '/admin/custom-orders': ADMIN_ROLES.EDITOR,
  '/admin/campaigns': ADMIN_ROLES.EDITOR,
  '/admin/coupons': ADMIN_ROLES.EDITOR,
  '/admin/storefront': ADMIN_ROLES.EDITOR,
  '/admin/newsletter': ADMIN_ROLES.EDITOR,
  '/admin/affiliates': ADMIN_ROLES.EDITOR,
  '/admin/seo': ADMIN_ROLES.EDITOR,
  '/admin/editorial': ADMIN_ROLES.EDITOR,
  '/admin/artists': ADMIN_ROLES.EDITOR,
  '/admin/collections': ADMIN_ROLES.EDITOR,
  '/admin/customers': ADMIN_ROLES.VIEWER,
  '/admin/dashboard': ADMIN_ROLES.VIEWER,
  '/admin/stats': ADMIN_ROLES.VIEWER,
  '/admin/conversion': ADMIN_ROLES.VIEWER,
};

/** @param {string} pathname */
export function getMinRoleForPath(pathname) {
  const match = Object.entries(ROUTE_MIN_ROLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => pathname.startsWith(prefix));

  return match?.[1] || ADMIN_ROLES.VIEWER;
}

export function getRoleLabel(role) {
  switch (role) {
    case ADMIN_ROLES.SUPERADMIN:
      return 'Super Admin';
    case ADMIN_ROLES.EDITOR:
      return 'Editor';
    case ADMIN_ROLES.VIEWER:
      return 'Visualizador';
    default:
      return 'Editor';
  }
}

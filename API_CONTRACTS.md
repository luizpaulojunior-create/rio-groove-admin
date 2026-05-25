# Rio Groove — Contratos de API — Admin (consumidor)

> Inventário do que o **admin consome**. Contrato canônico do backend: ver `rio-groove-backend/API_CONTRACTS.md`.

## Configuração HTTP

```javascript
// src/lib/api.js
baseURL: import.meta.env.VITE_API_URL
// Produção: https://rio-groove-backend.onrender.com/api
```

Todas as chamadas abaixo são relativas a `baseURL` (já inclui `/api`).

---

## Services → Backend REST

### products.js ✅

| Método | Path | Função |
|--------|------|--------|
| GET | `/products` | listar |
| GET | `/products/:id` | detalhe |
| POST | `/products` | criar (FormData) |
| PUT | `/products/:id` | atualizar (FormData) |
| DELETE | `/products/:id` | remover |

### orders.js ✅

| Método | Path |
|--------|------|
| GET | `/orders` |
| GET | `/orders/:id` |
| POST | `/orders` |
| PUT | `/orders/:id/status` |
| DELETE | `/orders/:id` |

### stock.js ✅

| Método | Path |
|--------|------|
| GET | `/stock` |
| GET | `/stock/:id` |
| POST | `/stock` |
| PUT | `/stock/:id` |
| DELETE | `/stock/:id` |
| POST | `/stock/:id/adjust` |
| POST | `/stock/seed` |

### collections.js ✅

| Método | Path |
|--------|------|
| GET | `/collections` |
| GET | `/collections/:id` |
| POST | `/collections` |
| PUT | `/collections/:id` |
| DELETE | `/collections/:id` |

### analytics.js ❌ (backend não implementa)

| Método | Path | Usado em |
|--------|------|----------|
| GET | `/analytics/dashboard` | Dashboard.jsx |
| GET | `/analytics/sales?period=` | Stats.jsx |
| GET | `/analytics/top-products` | Stats.jsx |

### shipping.js ⚠️ (contrato divergente)

| Admin chama | Backend real | Status |
|-------------|--------------|--------|
| `POST /shipping/quote` | `POST /api/shipping/quote` | ✅ |
| `GET /shipping/track/:code` | `GET /api/shipping/tracking/:id` | ❌ path |
| `POST /shipping/label/:orderId` | `POST /api/shipping/label` | ❌ path |
| `GET /shipping/oauth-url` | `GET /auth/melhor-envio/login` | ❌ path |
| `POST /shipping/oauth-callback` | `GET /auth/melhor-envio/callback` | ❌ método/path |
| `GET /shipping/shipments` | — | ❌ 404 |
| `GET /shipping/status` | — | ❌ 404 |

---

## Supabase direto (pages / auth)

| Consumidor | Operação | Tabela |
|------------|----------|--------|
| AuthContext, Login | Auth + RLS | `auth`, `admins` |
| Campaigns | CRUD | `campaigns` |
| Storefront*.jsx | CRUD CMS | `storefront_sections` |
| StorefrontLandingPages | CRUD | `landing_pages` |
| ProductDetail | Read | `inventory_movements`, `product_variants` |
| storage.js | Upload/delete | Storage `product-images` |

---

## Headers de autenticação

```
Authorization: Bearer <supabase_access_token>
```

Enviado por interceptor em `src/lib/api.js`. Backend ainda não valida.

---

## Retrocompatibilidade

Nenhum contrato foi alterado na Fase 1. Divergências documentadas para consolidação futura.

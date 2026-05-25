# Rio Groove — Arquitetura (Fase 1) — Admin

> Documento de governança. **Não altera comportamento em runtime.**

## Papel deste projeto

**Única interface operacional de gerenciamento** do ecossistema Rio Groove.

- Gestão de produtos, pedidos, estoque, coleções
- CMS da vitrine (seções, header, branding, landing pages)
- Campanhas e analytics (dashboard)

## Stack

React 19 + Vite 8 + React Router 7 + Tailwind 4 + Axios + Supabase JS

**Entry:** `src/main.jsx` → `src/App.jsx` → `src/routes/index.jsx`

## Dois padrões de acesso a dados (estado atual)

```
┌─────────────────────────────────────────────────────────────┐
│                        Admin SPA                            │
├──────────────────────────┬──────────────────────────────────┤
│  Backend REST (api.js)   │  Supabase direto (supabase.js)   │
│  Bearer JWT Supabase*    │  Anon key + RLS                    │
├──────────────────────────┼──────────────────────────────────┤
│  products, orders, stock │  auth, admins, storefront_sections│
│  collections, analytics│  campaigns, landing_pages          │
│  shipping (parcial)      │  inventory_movements (ProductDetail)│
└──────────────────────────┴──────────────────────────────────┘
```

\* JWT enviado mas backend **não valida** ainda.

## Services (`src/services/`)

| Arquivo | Destino | Endpoints / tabelas |
|---------|---------|---------------------|
| `products.js` | Backend REST | `/products` CRUD |
| `orders.js` | Backend REST | `/orders` CRUD + status |
| `stock.js` | Backend REST | `/stock` CRUD + adjust/seed |
| `collections.js` | Backend REST | `/collections` CRUD |
| `analytics.js` | Backend REST | `/analytics/*` ⚠️ **backend não implementa** |
| `shipping.js` | Backend REST | `/shipping/*` ⚠️ **várias rotas divergentes** |
| `customers.js` | Derivado | Agrega de `ordersService` |
| `storage.js` | Supabase Storage | Bucket `product-images` |

## Páginas com Supabase direto (fora de services)

| Página | Tabela(s) |
|--------|-----------|
| `Login.jsx` | Supabase Auth |
| `Campaigns.jsx` | `campaigns` |
| `ProductDetail.jsx` | `inventory_movements`, `product_variants` |
| `StorefrontHome/Header/Navigation/Branding/Mobile.jsx` | `storefront_sections` |
| `StorefrontLandingPages.jsx` | `landing_pages` |

## Autenticação

1. `Login.jsx` → `signInWithPassword`
2. `AuthContext` → `getSession` + verifica tabela `admins`
3. `ProtectedRoute` → exige `user && isAdmin`
4. `api.js` interceptors → anexa JWT, refresh em 401

**Sessão:** `localStorage` via Supabase client (`src/lib/supabase.js`)

## Upload / Storage

| Fluxo | Mecanismo |
|-------|-----------|
| Imagens de produto | FormData → backend `/products` |
| CMS (hero, banners, campanhas) | `storageService` → Supabase `product-images` |
| Config paths | `src/config/storage.js` |

## Rotas principais

Prefixo `/admin/*` — ver `src/routes/index.jsx`

Storefront CMS: `/admin/storefront/{home,header,navigation,branding,mobile,landing-pages}`

## Duplicações e legado (não remover Fase 1)

| Item | Path |
|------|------|
| Admin legado (não roteado) | `src/pages/Admin.jsx`, `src/components/ProductList.jsx` |
| Backups | `Orders.jsx.bak`, `AdminLayout.jsx.backup` |
| App alternativos | `App.temp.jsx`, `App.fixed.jsx` |
| Vite configs extras | `vite.config.temp.js`, `.prod.js`, `.backup.js`, etc. |
| Scripts root | `fix_*.js`, `find_stock.cjs`, `audit_*.js`, `test_*.cjs` |
| `uploadStockImage` | Definido em `storage.js`, **nunca usado** |
| Import Supabase morto | `stock.js` importa supabase sem usar |

## Riscos

1. Analytics/shipping services chamam endpoints inexistentes no backend
2. CMS e catálogo usam caminhos de dados diferentes (REST vs Supabase)
3. Redirect 401 em `api.js` aponta `/login` mas rota real é `/admin/login`
4. `AuthContext` seta `isAdmin(true)` no `onAuthStateChange` sem revalidar tabela `admins`

## Ecossistema

Ver também contratos em `rio-groove-backend/API_CONTRACTS.md`.

**Impacto Fase 1:** zero alteração de fluxo.

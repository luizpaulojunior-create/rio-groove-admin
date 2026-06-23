# Rio Groove — Variáveis de Ambiente — Admin

## Variáveis Vite (prefixo `VITE_`)

| Variável | Obrigatória | Uso | Fallback no código |
|----------|-------------|-----|-------------------|
| `VITE_SUPABASE_URL` | Sim | `src/lib/supabase.js` | — |
| `VITE_SUPABASE_ANON_KEY` | Sim | `src/lib/supabase.js` | — |
| `VITE_API_URL` | Recomendada | `src/lib/api.js` | `https://rio-groove-backend.onrender.com/api` |
| `VITE_MELHOR_ENVIO_URL` | Não | `.env.production` apenas | Orders.jsx hardcode `melhorenvio.com.br` |
| `VITE_SENTRY_DSN` | Não | `src/lib/monitoring.js` | Desligado se vazio |
| `VITE_STORE_URL` | Recomendada | Links de afiliado | `https://store.riogroovemovimentos.com.br` |

> Template: [.env.example](./.env.example) — copie para `.env.local`.

## Arquivo de produção existente

`.env.production` contém valores reais (não commitar secrets em novos ambientes).

## Exemplo local (`.env.local`)

```env
VITE_SUPABASE_URL=https://cvpobvvkhcqasumhfwps.supabase.co
# Publishable key (sb_publishable_…) — NÃO use eyJ… legacy
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_URL=http://localhost:3000/api
```

Ou: `Copy-Item .env.example .env.local` e edite com as chaves do dashboard.

**Chaves:** Supabase → Settings → API → **Publishable key** (mesma URL do backend).

---

## Comandos PowerShell — desenvolvimento

```powershell
cd c:\Users\luizp\Downloads\rio-groove-admin
npm install
npm run dev
# Abre em http://localhost:5173/admin/login
```

## Comandos PowerShell — build

```powershell
cd c:\Users\luizp\Downloads\rio-groove-admin
npm run build
npm run preview
```

## Deploy (Cloudflare Pages — build nativo)

**Não usar GitHub Actions para deploy** (removido — competia com o build do Cloudflare).

Variáveis no painel Cloudflare Pages → **Settings → Environment variables** (Production):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

## Validação pós-deploy

```powershell
# Backend acessível
Invoke-RestMethod https://rio-groove-backend.onrender.com/api/health

# Auditoria completa (backend repo)
cd c:\Users\luizp\Downloads\rio-groove-backend-final\rio-groove-backend
npm run audit:prod

# Build local OK
npm run build
```

## Projetos relacionados

| Projeto | Env doc |
|---------|---------|
| Backend | `rio-groove-backend/ENVIRONMENT.md` |
| Storefront | `rio-groove-store-v2/ENVIRONMENT.md` |

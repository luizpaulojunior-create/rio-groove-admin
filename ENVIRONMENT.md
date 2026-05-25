# Rio Groove — Variáveis de Ambiente — Admin

## Variáveis Vite (prefixo `VITE_`)

| Variável | Obrigatória | Uso | Fallback no código |
|----------|-------------|-----|-------------------|
| `VITE_SUPABASE_URL` | Sim | `src/lib/supabase.js` | — |
| `VITE_SUPABASE_ANON_KEY` | Sim | `src/lib/supabase.js` | — |
| `VITE_API_URL` | Recomendada | `src/lib/api.js` | `https://rio-groove-backend.onrender.com/api` |
| `VITE_MELHOR_ENVIO_URL` | Não | `.env.production` apenas | Orders.jsx hardcode `melhorenvio.com.br` |

> **Não existe `.env.example`** neste repo — criar localmente a partir desta tabela.

## Arquivo de produção existente

`.env.production` contém valores reais (não commitar secrets em novos ambientes).

## Exemplo local (`.env.local`)

```env
VITE_SUPABASE_URL=https://cvpobvvkhcqasumhfwps.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_API_URL=http://localhost:3000/api
```

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

## Comandos PowerShell — deploy (Netlify)

Deploy via Git push para branch conectada ao Netlify.

```powershell
cd c:\Users\luizp\Downloads\rio-groove-admin
npm run build
# dist/ é publicado automaticamente pelo Netlify
# SPA fallback configurado em netlify.toml
```

Variáveis de ambiente devem ser configuradas no painel Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

## Validação pós-deploy

```powershell
# Backend acessível
Invoke-RestMethod https://rio-groove-backend.onrender.com/api/health

# Build local OK
npm run build
```

## Projetos relacionados

| Projeto | Env doc |
|---------|---------|
| Backend | `rio-groove-backend/ENVIRONMENT.md` |
| Storefront | `rio-groove-store-v2/ENVIRONMENT.md` |

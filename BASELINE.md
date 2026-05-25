# Baseline oficial — Fase 3 estável

> Checkpoint arquitetural. **Não alterar esta tag.** Próximas evoluções em branch separada.

| Campo | Valor |
|-------|-------|
| **Tag** | `baseline-fase3-estavel` |
| **SHA** | `4c32667` |
| **Deploy** | Cloudflare Pages — `https://rio-groove-store-v2.pages.dev` |
| **Data** | maio/2026 |

## Escopo congelado

- Storefront v2 intacta (Supabase + checkout backend)
- Legado Fase 3 removido (scripts debug, Success.tsx, orders.ts morto)
- Docs ARCHITECTURE / API_CONTRACTS / ENVIRONMENT

## Ambiente legado (intencional, fora desta baseline v2)

- `https://proud-breeze-a824.luizpaulojunior.workers.dev`
- `https://store.riogroovemovimentos.com.br` → Worker (não migrar ainda)

## Rollback / redeploy

```powershell
git checkout baseline-fase3-estavel
npm run build
npx wrangler pages deploy dist --project-name=rio-groove-store-v2 --commit-dirty=true
```

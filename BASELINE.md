# Baseline oficial — Fase 3 estável

> Checkpoint arquitetural. **Não alterar esta tag.** Próximas evoluções em branch separada.

| Campo | Valor |
|-------|-------|
| **Tag** | `baseline-fase3-estavel` |
| **SHA** | `34a5e73` |
| **Deploy** | Cloudflare Pages — `https://rio-groove-admin-painel.pages.dev` |
| **Domínio** | `https://admin.riogroovemovimentos.com.br` |
| **Data** | maio/2026 |

## Escopo congelado

- Contratos shipping/analytics alinhados (Fase 2)
- Legado Fase 3 removido (scripts, vite configs duplicados, netlify.toml)
- `.env.example` + docs ENVIRONMENT

## Fora desta baseline

Alterações CMS Storefront, ProductForm, inventory e segurança — **não incluídas** nesta tag.

## Rollback / redeploy

```powershell
git checkout baseline-fase3-estavel
npm run build
npx wrangler pages deploy dist --project-name=rio-groove-admin-painel --commit-dirty=true
```

# vince-art-showcase

The public DeYaanga site (deyaanga.art): Vince's portfolio layer plus the
hidden Atelier project layer. Vite + React + Tailwind; data is fetched at
runtime from this repo's `public/` (portfolio.json, project.json, synced
agent docs).

## Git

Single developer. Commit directly to `main` and push to `main` — do not
create feature branches. (Owner decision, 2026-07-16.)

Note: `main` receives frequent automated commits (usage snapshots, daily
artwork publishes), so pull/rebase onto `origin/main` right before pushing.

## Checks

```bash
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npm test
npm run build
```

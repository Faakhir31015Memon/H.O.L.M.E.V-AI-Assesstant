# H.O.L.M.E.V

Holographic Operating Layer for Multi-device Engagement & Vision — a local-first personal AI command center.

Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Phases: [docs/PHASES.md](docs/PHASES.md) · Shipped: [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)

## Run (Phase 1)

Terminal 1 — command center:

```bash
npm install --prefix apps/api
npm run dev:api
```

Terminal 2 — spatial HUD:

```bash
npm install
npm run dev
```

Optional Python language service (Node falls back to the same rules if this is down):

```bash
pip install -r apps/ai-engine/requirements.txt
npm run dev:ai
```

Optional Postgres + Redis:

```bash
docker compose -f infra/docker-compose.yml up -d
```

## Try

In the HUD input:

- `bedroom ki light 40 percent kar do`
- `night mode activate`
- `chrome kholo`
- `bedroom aur corridor compare karo`
- `computer shutdown kar do` (needs **CONFIRM** in the footer)

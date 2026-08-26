# What is implemented now

## Running pieces

| Piece | Location | Notes |
|-------|----------|--------|
| Spatial HUD | `src/` | React + R3F holographic dashboard |
| Command center | `apps/api` | Fastify REST + WebSocket |
| Language / chat stubs | `apps/ai-engine` | FastAPI; rule-based understand |
| Protocol | `packages/holmev-protocol` | Shared TypeScript types |
| Postgres schema | `infra/postgres/init.sql` | Applied when Compose is up |
| Compose | `infra/docker-compose.yml` | Postgres + Redis (optional) |

## Command pipeline

1. HUD `executeCommand(text)` → `POST /api/v1/commands/execute`
2. Gateway calls `POST /api/v1/language/understand` (Python if healthy, else local rules)
3. Validate IR → RBAC (admin session default in Phase 1) → risk class
4. LOW: execute on in-memory home/PC simulators  
   MEDIUM+: return `needs_confirmation` until `POST /api/v1/commands/confirm`
5. Audit log + event bus (`COMMAND_EXECUTED` / `COMMAND_DENIED`)

## Try these phrases

- `bedroom ki light 40 percent kar do`
- `living room ki lights on`
- `night mode activate`
- `chrome kholo`
- `volume 50%`
- `cctv bedroom open karo`
- `bedroom aur corridor compare karo`
- `computer shutdown kar do` → confirmation required

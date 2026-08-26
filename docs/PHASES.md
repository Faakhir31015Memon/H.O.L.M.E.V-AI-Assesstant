# H.O.L.M.E.V build phases

Do not build the full system in one pass.

| Phase | Scope | Status |
|-------|--------|--------|
| **1** | Core: command IR, understand, execute pipeline, basic memory, HUD wired to API, STT/TTS placeholders | **In progress (this repo)** |
| **2** | PC control via desktop agent (allow-list: apps, volume, files, browser, system) | Not started |
| **3** | Vision: camera, face detect/recognize, objects, hand tracking | HUD mock only |
| **4** | Gesture → 3D UI; projector vs monitor display modes | UI exists; no MediaPipe yet |
| **5** | CCTV: discovery, live, record, grid, compare, search | UI mock |
| **6** | Smart home: HA + MQTT + real devices | Simulator only |
| **7** | Companion: pgvector memory, emotion-aware tone | Stub |
| **8** | Security: MFA, device certs, RBAC, audit, encryption | Risk engine + audit log (in-memory) |
| **9** | Full integration (“good morning” → environment + UI + devices) | Later |

## Phase 1 acceptance

- Natural language (Hindi/English mix) maps to structured commands.
- Low-risk home actions apply immediately (simulated devices).
- High-risk actions require explicit confirmation.
- No arbitrary shell execution.
- Spatial UI logs intent, risk, and result.
- Python AI engine optional; Node gateway works alone if Python is down.

# H.O.L.M.E.V — Master Architecture & Development Blueprint

**Holographic Operating Layer for Multi-device Engagement & Vision**  
Personal AI Command Center — complete system design.

This document is the source of truth for the platform. Implementation follows the phased roadmap in [PHASES.md](./PHASES.md). What is actually running today is listed in [IMPLEMENTATION.md](./IMPLEMENTATION.md).

---

## 0. Project vision

H.O.L.M.E.V is not only a voice assistant. It is a local-first **AI operating layer / personal agent platform**. Voice, vision, gesture, IoT, CCTV, PC, and mobile all go through one **permission-controlled command system**.

Core capabilities (target, not all shipped):

- Lights, AC, fan, TV, smart plugs
- Mobile and PC/laptop control (apps, files, media, browser, lock/shutdown)
- Natural language (e.g. “H.O.L.M.E.V, room ki lights 50% kar do.”)
- Wake word, STT, TTS
- Hand gestures and spatial UI (projector if present, otherwise monitor)
- CCTV live + recordings
- Face profiles (never sole auth for high-risk actions)
- Mood/emotion **estimates only** — never clinical diagnosis
- Long-term memory as a personal companion

---

## 1. High-level architecture

```
                    ┌──────────────────────┐
                    │     H.O.L.M.E.V      │
                    │ AI BRAIN / CENTRAL   │
                    │  LLM + Voice + Memory│
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
        Voice Engine      Vision Engine     Automation
              │                │                │
          Microphone       Camera          Command Router
              └────────────────┼────────────────┘
                    ┌──────────▼──────────┐
                    │   COMMAND CENTER    │
                    │  Python + Node.js   │
                    └──────────┬──────────┘
       Smart Home          Computers             Devices
       ESP32 / MQTT        PC / Laptop           Mobile
                    ┌──────────▼──────────┐
                    │  SPATIAL UI ENGINE  │
                    │ React + Three.js    │
                    └─────────────────────┘
                     Projector / Monitor
```

**Central brain:** understand speech, converse, convert language → structured commands, remember context, adapt tone from emotion *estimates*, discover/control devices, manage cameras and displays.

---

## 2. Layer model

| Layer | Name | Role |
|-------|------|------|
| 6 | UI | Voice + gesture; holographic interface on projector/monitor |
| 5 | Personality | Memory, emotion estimates, conversation style |
| 4 | Intelligence | NLP, reasoning, planning |
| 3 | Perception | Voice, face, gesture, vision |
| 2 | Control | PC, mobile, CCTV, smart home |
| 1 | Infrastructure | API, server, database, security |

---

## 3. Module map

```
HOLMEV/
├── core/                 # shared protocol, events, command IR
├── ai-core/              # brain, memory, command-understanding
├── api/                  # Node Fastify gateway
├── voice/                # STT, TTS, wake word
├── vision/               # hand, gesture, objects
├── face/  emotion/  memory/  cctv/  devices/
├── computer-control/     # windows, apps, files, browser (allow-list only)
├── smart-home/
├── spatial-ui/           # React + Three.js (this repo’s current HUD)
├── authentication/  security/
├── mobile-agent/  desktop-agent/
├── database/  storage/  infrastructure/
```

**Hard rules**

- Face recognition is **not** the sole authentication factor for high-risk actions.
- Arbitrary shell from the LLM is **forbidden**. Allow-listed OS actions + confirmation.
- Emotion output is probability estimates; never medical diagnosis.
- Server never remotely “owns” a device: authenticated **agents** execute locally.

---

## 4. Device agents

```
H.O.L.M.E.V SERVER
        │  Auth + Command
        │  Secure WebSocket
   PC Agent · Laptop Agent · Mobile Agent
```

---

## 5. Stack (target)

| System | Stack |
|--------|--------|
| Spatial UI | React, TypeScript, Vite, Tailwind, Three.js / R3F, Framer Motion |
| Gateway | Node.js, TypeScript, Fastify, WebSocket, REST |
| AI / Vision | Python, FastAPI, OpenCV, MediaPipe, PyTorch (later) |
| Data | PostgreSQL + pgvector, Redis, BullMQ (later) |
| CCTV | RTSP, FFmpeg, WebRTC |
| Desktop agent | Node/TypeScript, permission-gated |
| Mobile | Flutter (later) |
| Home | Home Assistant + MQTT (later) |
| Deploy | Docker Compose → Ubuntu + Nginx |

---

## 6. Custom API (your protocol, not vendor lock-in)

Gateway: `api.holmev.local` (dev) → production domain later.

Primary routes:

- `POST /api/v1/voice/transcribe` · `/speak` · `/wake-word`
- `POST /api/v1/language/understand`
- `POST /api/v1/ai/chat`
- `POST /api/v1/commands/execute`
- `POST /api/v1/vision/face/*` · `/gesture/*` · `/emotion/analyze`
- `GET/POST /api/v1/devices*` · `/cameras*` · `/home/*` · `/memory/*`

**Structured command IR** (canonical):

```json
{
  "command": "device.control",
  "target": { "type": "light", "location": "bedroom" },
  "action": "brightness",
  "value": 40,
  "authorization": "required"
}
```

Flow: **AI → Intent → Validate → Permission → Risk class → Auth if needed → Agent → Execute → Audit**

---

## 7. Event bus

Services do not mesh 1:1. Events include: `WAKE_WORD_DETECTED`, `VOICE_COMMAND`, `FACE_RECOGNIZED`, `GESTURE_DETECTED`, `EMOTION_CHANGED`, `CAMERA_CONNECTED`, `DEVICE_OFFLINE`, `COMMAND_EXECUTED`, `COMMAND_DENIED`.

---

## 8. Local-first

Sensitive data stays on the home LAN. Internet only for optional remote access, updates, or models you explicitly allow. Path: **laptop server → dedicated PC → optional hybrid tunnel**.

---

## 9. Risk-based permissions

| Risk | Examples | Gate |
|------|----------|------|
| LOW | Open Chrome, play music, lights on | Execute |
| MEDIUM | Open files, change settings, garage | Identity check |
| HIGH | Delete files, shutdown, install, disable security | Face + device/Hello + confirm |
| EXTREME | Delete CCTV recordings | MFA + explicit confirm |

---

## 10. Conceptual data entities

Users, Devices, Permissions, Sessions, Commands, Cameras, CameraLocations, CameraRecordings, SmartDevices, Automations, VoiceCommands, Memory (pgvector), Conversations, SecurityLogs, DeviceTokens.

Face **embeddings** (encrypted), not raw photos, in biometric stores.

---

## 11. Build phases

See [PHASES.md](./PHASES.md). Do not attempt full Iron-Man integration in one sprint.

---

## 12. Example: smart home command

`"Room ki lights 40% kar do."` → STT → understand → `LIGHT_CONTROL` / `ROOM_LIGHT` / `40` → MQTT/HA → ESP32 → light.

Today’s Phase 1 executes this as an in-process **home simulator** behind the same command IR so the pipeline is real before hardware exists.

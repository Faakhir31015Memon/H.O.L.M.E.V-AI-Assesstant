import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import type { Role, UnderstandResult } from "../../../core/protocol.ts";
import { cameras } from "./cctvSim.ts";
import { confirmCommand, listAudit, runCommand } from "./commandEngine.ts";
import { subscribe } from "./eventBus.ts";
import { listHome } from "./homeSim.ts";
import { getPc } from "./pcSim.ts";
import { understandLocal } from "./understand.ts";

const PORT = Number(process.env.HOLMEV_API_PORT ?? 8787);
const AI_URL = process.env.HOLMEV_AI_URL ?? "http://127.0.0.1:8790";

const sockets = new Set<{ send: (data: string) => void }>();

subscribe((event, payload) => {
  const msg = JSON.stringify({ event, payload, ts: Date.now() });
  for (const ws of sockets) {
    try {
      ws.send(msg);
    } catch {
      sockets.delete(ws);
    }
  }
});

async function understand(text: string): Promise<UnderstandResult> {
  try {
    const res = await fetch(`${AI_URL}/api/v1/language/understand`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return (await res.json()) as UnderstandResult;
  } catch {
    /* local fallback */
  }
  return understandLocal(text);
}

async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(websocket);

  app.get("/health", async () => ({
    ok: true,
    service: "holmev-command-center",
    phase: 1,
  }));

  app.get("/api/v1/system", async () => ({
    home: listHome(),
    pc: getPc(),
    cameras,
  }));

  app.get("/api/v1/devices", async () => ({ devices: listHome(), pc: getPc() }));
  app.get("/api/v1/cameras", async () => ({ cameras }));
  app.get("/api/v1/security/audit", async () => ({ logs: listAudit() }));

  app.post("/api/v1/language/understand", async (req) => {
    const { text } = (req.body as { text?: string }) ?? {};
    if (!text) return { error: "text required" };
    return understand(text);
  });

  app.post("/api/v1/ai/chat", async (req) => {
    const { text } = (req.body as { text?: string }) ?? {};
    const u = await understand(text ?? "");
    return { reply: u.command.spokenReply, understand: u };
  });

  app.post("/api/v1/commands/execute", async (req) => {
    const body = (req.body as { text?: string; role?: Role }) ?? {};
    if (!body.text) return { status: "error", spokenReply: "Empty command.", risk: "LOW", auditId: "none" };
    const understood = await understand(body.text);
    return runCommand(understood, body.role ?? "admin");
  });

  app.post("/api/v1/commands/confirm", async (req) => {
    const { confirmToken } = (req.body as { confirmToken?: string }) ?? {};
    if (!confirmToken) return { status: "error", spokenReply: "Missing confirmToken.", risk: "HIGH", auditId: "none" };
    return confirmCommand(confirmToken);
  });

  app.get("/api/v1/events", { websocket: true }, (socket) => {
    sockets.add(socket);
    socket.send(JSON.stringify({ event: "CONNECTED", payload: { service: "holmev" }, ts: Date.now() }));
    socket.on("close", () => sockets.delete(socket));
  });

  await app.listen({ port: PORT, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

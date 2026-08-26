import { randomUUID } from "node:crypto";
import type { ExecuteResponse, Role, StructuredCommand, UnderstandResult } from "../../../core/protocol.ts";
import { cameras, findCameras } from "./cctvSim.ts";
import { emit } from "./eventBus.ts";
import { activateNightMode, applyHome, listHome } from "./homeSim.ts";
import { getPc, openApplication, screenshot, setVolume } from "./pcSim.ts";
import { classifyRisk, isAllowed } from "./permissions.ts";

interface Pending {
  token: string;
  command: StructuredCommand;
  role: Role;
  expires: number;
}

const pending = new Map<string, Pending>();
const audit: Array<Record<string, unknown>> = [];

function auditPush(row: Record<string, unknown>) {
  const id = randomUUID();
  const entry = { id, at: new Date().toISOString(), ...row };
  audit.push(entry);
  emit("SECURITY_LOG", entry);
  return id;
}

export function listAudit() {
  return audit.slice(-200);
}

function executeIr(cmd: StructuredCommand): unknown {
  switch (cmd.command) {
    case "device.control": {
      const type = cmd.target?.type ?? "light";
      if (type === "pc" || cmd.action === "open_application" || cmd.action === "volume" || cmd.action === "screenshot") {
        if (cmd.action === "open_application") {
          return openApplication(String(cmd.target?.application ?? cmd.value ?? ""));
        }
        if (cmd.action === "volume") return setVolume(Number(cmd.value ?? 50));
        if (cmd.action === "screenshot") return screenshot();
      }
      const location = cmd.target?.location ?? "bedroom";
      if (cmd.action === "brightness") {
        return applyHome(type, location, { brightness: Number(cmd.value), power: Number(cmd.value) > 0 });
      }
      if (cmd.action === "power") {
        const on = Boolean(cmd.value);
        return applyHome(type, location, { power: on, brightness: on ? 80 : 0 });
      }
      if (cmd.action === "set_temperature") {
        return applyHome("ac", location, { power: true, temperature: Number(cmd.value) });
      }
      throw new Error(`Unsupported device action: ${cmd.action}`);
    }
    case "home.scene":
      if (cmd.action === "night_mode") return activateNightMode();
      throw new Error(`Unknown scene: ${cmd.action}`);
    case "cctv.view":
      return { layout: "single", cameras: findCameras([cmd.target?.location ?? "bedroom"]) };
    case "cctv.compare": {
      const ids = (cmd.value as { cameras?: string[] })?.cameras ?? [];
      return { layout: "side_by_side", cameras: findCameras(ids) };
    }
    case "cctv.grid":
      return { layout: "grid", cameras };
    case "system.info":
      return { home: listHome(), pc: getPc(), cameras };
    case "system.power":
      return { simulated: true, action: cmd.action, note: "Desktop agent not connected; command accepted after confirmation." };
    case "ui.mode":
      return { ui: cmd.action };
    case "conversation.reply":
      return { chat: true };
    default:
      throw new Error("Unknown command");
  }
}

export function runCommand(understood: UnderstandResult, role: Role): ExecuteResponse {
  const cmd = understood.command;
  const risk = classifyRisk(cmd);
  if (!isAllowed(role, cmd)) {
    const auditId = auditPush({ event: "COMMAND_DENIED", reason: "rbac", cmd, role });
    emit("COMMAND_DENIED", { cmd, role });
    return {
      status: "denied",
      risk,
      command: cmd,
      spokenReply: "You do not have permission for that action.",
      auditId,
    };
  }

  if (risk === "MEDIUM" || risk === "HIGH" || risk === "EXTREME") {
    const token = randomUUID();
    pending.set(token, { token, command: cmd, role, expires: Date.now() + 60_000 });
    const auditId = auditPush({ event: "CONFIRMATION_REQUIRED", risk, cmd });
    return {
      status: "needs_confirmation",
      risk,
      command: cmd,
      spokenReply: cmd.spokenReply ?? "This action needs confirmation.",
      confirmToken: token,
      auditId,
    };
  }

  try {
    const result = executeIr(cmd);
    const auditId = auditPush({ event: "COMMAND_EXECUTED", risk, cmd, result });
    emit("COMMAND_EXECUTED", { cmd, result });
    return {
      status: cmd.command === "conversation.reply" ? "replied" : "executed",
      risk,
      command: cmd,
      result,
      spokenReply: cmd.spokenReply ?? "Done.",
      auditId,
    };
  } catch (err) {
    const auditId = auditPush({ event: "COMMAND_ERROR", error: String(err), cmd });
    return {
      status: "error",
      risk,
      command: cmd,
      spokenReply: err instanceof Error ? err.message : "Command failed.",
      auditId,
    };
  }
}

export function confirmCommand(token: string): ExecuteResponse {
  const item = pending.get(token);
  if (!item || item.expires < Date.now()) {
    return {
      status: "error",
      risk: "HIGH",
      spokenReply: "Confirmation expired. Please ask again.",
      auditId: auditPush({ event: "CONFIRM_EXPIRED", token }),
    };
  }
  pending.delete(token);
  try {
    const result = executeIr(item.command);
    const risk = classifyRisk(item.command);
    const auditId = auditPush({ event: "COMMAND_EXECUTED", confirmed: true, cmd: item.command, result });
    emit("COMMAND_EXECUTED", { cmd: item.command, result, confirmed: true });
    return {
      status: "executed",
      risk,
      command: item.command,
      result,
      spokenReply: `${item.command.action} confirmed and executed.`,
      auditId,
    };
  } catch (err) {
    return {
      status: "error",
      risk: classifyRisk(item.command),
      spokenReply: err instanceof Error ? err.message : "Command failed.",
      auditId: auditPush({ event: "COMMAND_ERROR", error: String(err) }),
    };
  }
}

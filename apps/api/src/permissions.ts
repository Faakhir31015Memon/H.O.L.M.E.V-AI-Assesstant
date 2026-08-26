import type { RiskLevel, StructuredCommand } from "../../../core/protocol.ts";

const HIGH_ACTIONS = new Set(["shutdown", "restart", "lock", "delete", "install", "shell"]);
const EXTREME_ACTIONS = new Set(["delete_recordings", "wipe", "disable_security"]);

export function classifyRisk(cmd: StructuredCommand): RiskLevel {
  const action = cmd.action.toLowerCase();
  if (EXTREME_ACTIONS.has(action) || cmd.command.startsWith("cctv") && action.includes("delete")) {
    return "EXTREME";
  }
  if (cmd.command === "system.power" || HIGH_ACTIONS.has(action)) {
    return "HIGH";
  }
  if (cmd.command === "device.control" && (action === "open_file" || action === "change_setting")) {
    return "MEDIUM";
  }
  if (cmd.command === "home.scene" && action === "disarm") {
    return "HIGH";
  }
  return "LOW";
}

const ROLE_ALLOW: Record<string, Set<string>> = {
  admin: new Set(["*"]),
  family: new Set([
    "device.control",
    "home.scene",
    "cctv.view",
    "system.info",
    "conversation.reply",
    "ui.mode",
  ]),
  guest: new Set(["conversation.reply", "system.info", "ui.mode"]),
};

export function isAllowed(role: string, cmd: StructuredCommand): boolean {
  const allowed = ROLE_ALLOW[role] ?? ROLE_ALLOW.guest;
  if (allowed.has("*")) return true;
  return allowed.has(cmd.command);
}

import type { RiskLevel, StructuredCommand } from "../../../packages/holmev-protocol/index.ts";

export function classifyRisk(cmd: StructuredCommand): RiskLevel {
  if (cmd.command === "os.control") {
    const a = cmd.action ?? "";
    if (["shutdown", "restart", "lock"].includes(a)) return "HIGH";
    if (["delete_file", "install", "shell"].includes(a)) return "HIGH";
    if (["open_file", "change_setting"].includes(a)) return "MEDIUM";
    return "LOW";
  }
  if (cmd.command === "cctv.view" || cmd.command === "cctv.compare" || cmd.command === "cctv.grid") {
    return "MEDIUM";
  }
  if (cmd.action === "delete_recordings") return "EXTREME";
  if (cmd.command === "home.scene" && cmd.action === "security_disarm") return "HIGH";
  if (cmd.command === "device.control" && cmd.target?.type === "door") return "MEDIUM";
  return "LOW";
}

export function authorizationForRisk(risk: RiskLevel): StructuredCommand["authorization"] {
  if (risk === "LOW") return "none";
  if (risk === "MEDIUM") return "identity";
  if (risk === "HIGH") return "required";
  return "mfa";
}

const ROLE_ALLOW: Record<string, string[]> = {
  admin: ["*"],
  family: ["device.control", "home.scene", "cctv.view", "cctv.compare", "cctv.grid", "system.query", "chat", "ui.control"],
  guest: ["system.query", "chat", "ui.control"],
};

export function canExecute(role: string, command: string): boolean {
  const allow = ROLE_ALLOW[role] ?? ROLE_ALLOW.guest;
  return allow.includes("*") || allow.includes(command);
}

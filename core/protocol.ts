export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type CommandName =
  | "device.control"
  | "home.scene"
  | "cctv.view"
  | "cctv.compare"
  | "cctv.grid"
  | "system.info"
  | "system.power"
  | "conversation.reply"
  | "ui.mode";

export type Role = "admin" | "family" | "guest";

export interface CommandTarget {
  type: string;
  location?: string;
  id?: string;
  application?: string;
}

export interface StructuredCommand {
  command: CommandName;
  target?: CommandTarget;
  action: string;
  value?: string | number | boolean | Record<string, unknown>;
  authorization: "none" | "required";
  spokenReply?: string;
}

export interface UnderstandResult {
  intent: string;
  command: StructuredCommand;
  confidence: number;
}

export interface ExecuteRequest {
  text: string;
  sessionId?: string;
  confirmToken?: string;
}

export interface ExecuteResponse {
  status: "executed" | "needs_confirmation" | "denied" | "error" | "replied";
  risk: RiskLevel;
  command?: StructuredCommand;
  result?: unknown;
  spokenReply: string;
  confirmToken?: string;
  auditId: string;
}

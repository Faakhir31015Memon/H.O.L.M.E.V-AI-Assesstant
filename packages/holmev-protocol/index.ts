export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export type UserRole = "admin" | "family" | "guest";

export type CommandName =
  | "device.control"
  | "home.scene"
  | "cctv.view"
  | "cctv.compare"
  | "cctv.grid"
  | "os.control"
  | "ui.control"
  | "system.query"
  | "chat";

export type AuthorizationMode = "none" | "identity" | "required" | "mfa";

export interface CommandTarget {
  type: string;
  location?: string;
  id?: string;
  application?: string;
}

export interface StructuredCommand {
  command: CommandName;
  target?: CommandTarget;
  action?: string;
  value?: number | string | boolean;
  cameras?: string[];
  layout?: "single" | "side_by_side" | "grid";
  authorization: AuthorizationMode;
  spokenReply?: string;
}

export interface UnderstandResult {
  intent: string;
  command: StructuredCommand;
  confidence: number;
  rawText: string;
}

export interface CommandExecuteRequest {
  text: string;
  sessionId?: string;
  confirmToken?: string;
}

export interface CommandExecuteResponse {
  id: string;
  status: "executed" | "needs_confirmation" | "denied" | "chat";
  risk: RiskLevel;
  understand: UnderstandResult;
  result?: Record<string, unknown>;
  confirmToken?: string;
  spokenReply: string;
}

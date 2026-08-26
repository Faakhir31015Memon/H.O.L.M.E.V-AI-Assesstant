export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export interface HomeDevice {
  id: string;
  type: string;
  location: string;
  power: boolean;
  brightness?: number;
  temperature?: number;
}

export interface SystemSnapshot {
  home: HomeDevice[];
  pc: { volume: number; openApps: string[] };
  cameras: Array<{ id: string; name: string; location: string; people?: number }>;
}

export async function fetchSystem(): Promise<SystemSnapshot> {
  const res = await fetch("/api/v1/system");
  if (!res.ok) throw new Error(`Gateway ${res.status}`);
  return res.json() as Promise<SystemSnapshot>;
}

export interface StructuredCommand {
  command: string;
  target?: { type: string; location?: string; application?: string };
  action: string;
  value?: unknown;
  authorization: string;
  spokenReply?: string;
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

export async function executeOnGateway(text: string): Promise<ExecuteResponse> {
  const res = await fetch("/api/v1/commands/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, role: "admin" }),
  });
  if (!res.ok) {
    throw new Error(`Gateway ${res.status}`);
  }
  return res.json() as Promise<ExecuteResponse>;
}

export async function confirmOnGateway(confirmToken: string): Promise<ExecuteResponse> {
  const res = await fetch("/api/v1/commands/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirmToken }),
  });
  if (!res.ok) {
    throw new Error(`Gateway ${res.status}`);
  }
  return res.json() as Promise<ExecuteResponse>;
}

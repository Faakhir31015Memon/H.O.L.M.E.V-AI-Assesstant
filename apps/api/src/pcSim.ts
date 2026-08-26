const apps = new Set(["chrome", "vscode", "vs code", "explorer", "notepad"]);

export interface PcState {
  volume: number;
  openApps: string[];
  lastScreenshot?: string;
}

const pc: PcState = { volume: 40, openApps: [] };

export function getPc() {
  return { ...pc, openApps: [...pc.openApps] };
}

export function openApplication(name: string) {
  const n = name.toLowerCase().trim();
  const allowed = [...apps].find((a) => n.includes(a) || a.includes(n));
  if (!allowed) {
    throw new Error(`Application "${name}" is not on the allow-list.`);
  }
  const label = allowed === "vs code" ? "vscode" : allowed;
  if (!pc.openApps.includes(label)) pc.openApps.push(label);
  return { opened: label, openApps: [...pc.openApps] };
}

export function setVolume(value: number) {
  pc.volume = Math.max(0, Math.min(100, value));
  return { volume: pc.volume };
}

export function screenshot() {
  pc.lastScreenshot = new Date().toISOString();
  return { screenshotAt: pc.lastScreenshot };
}

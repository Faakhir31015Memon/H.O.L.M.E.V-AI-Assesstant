export interface HomeDevice {
  id: string;
  type: string;
  location: string;
  power: boolean;
  brightness?: number;
  temperature?: number;
}

const devices = new Map<string, HomeDevice>([
  ["light.bedroom", { id: "light.bedroom", type: "light", location: "bedroom", power: false, brightness: 0 }],
  ["light.living_room", { id: "light.living_room", type: "light", location: "living_room", power: false, brightness: 80 }],
  ["ac.bedroom", { id: "ac.bedroom", type: "ac", location: "bedroom", power: false, temperature: 24 }],
  ["fan.bedroom", { id: "fan.bedroom", type: "fan", location: "bedroom", power: false }],
  ["tv.living_room", { id: "tv.living_room", type: "tv", location: "living_room", power: false }],
]);

function key(type: string, location: string) {
  return `${type}.${location.replace(/\s+/g, "_")}`;
}

export function listHome() {
  return [...devices.values()];
}

export function applyHome(type: string, location: string, patch: Partial<HomeDevice>) {
  const loc = normalizeLocation(location);
  const id = key(type, loc);
  let device = devices.get(id);
  if (!device) {
    device = { id, type, location: loc, power: false };
    devices.set(id, device);
  }
  Object.assign(device, patch);
  if (typeof patch.brightness === "number") {
    device.power = patch.brightness > 0;
  }
  return { ...device };
}

export function activateNightMode() {
  applyHome("light", "bedroom", { power: true, brightness: 20 });
  applyHome("light", "living_room", { power: false, brightness: 0 });
  applyHome("ac", "bedroom", { power: true, temperature: 24 });
  applyHome("tv", "living_room", { power: false });
  return { scene: "night_mode", devices: listHome() };
}

export function normalizeLocation(raw: string) {
  const t = raw.toLowerCase().replace(/_/g, " ").trim();
  if (t.includes("living") || t.includes("lounge")) return "living_room";
  if (t.includes("bed") || t === "room") return "bedroom";
  if (t.includes("corridor") || t.includes("hall")) return "corridor";
  if (t.includes("entrance") || t.includes("gate")) return "entrance";
  return t.replace(/\s+/g, "_") || "bedroom";
}

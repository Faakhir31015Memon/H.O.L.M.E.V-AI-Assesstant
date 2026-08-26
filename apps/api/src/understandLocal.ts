import type { CommandName, StructuredCommand, UnderstandResult } from "../../../packages/holmev-protocol/index.ts";
import { authorizationForRisk, classifyRisk } from "./permissions.ts";

function loc(text: string): string | undefined {
  const t = text.toLowerCase();
  if (t.includes("bedroom") || t.includes("bed room") || t.includes("bedr")) return "bedroom";
  if (t.includes("living") || t.includes("lounge") || t.includes("drawing")) return "living_room";
  if (t.includes("corridor") || t.includes("hallway") || t.includes("gallery")) return "corridor";
  if (t.includes("entrance") || t.includes("gate") || t.includes("darwaza")) return "entrance";
  if (t.includes("garage")) return "garage";
  if (t.includes("kitchen")) return "kitchen";
  if (t.includes("room")) return "bedroom";
  return undefined;
}

function brightness(text: string): number | undefined {
  const m = text.match(/(\d{1,3})\s*(%|percent|pct)?/i);
  if (!m) return undefined;
  return Math.min(100, Math.max(0, Number(m[1])));
}

function wantOn(text: string): boolean | undefined {
  const t = text.toLowerCase();
  if (/\b(off|band|bujha|shutdown lights)\b/.test(t)) return false;
  if (/\b(on|chala|jal|activate)\b/.test(t) && !t.includes("night mode")) return true;
  return undefined;
}

function finish(rawText: string, command: StructuredCommand, intent: string, confidence: number): UnderstandResult {
  const risk = classifyRisk(command);
  command.authorization = authorizationForRisk(risk);
  return { intent, command, confidence, rawText };
}

export function understandLocal(rawText: string): UnderstandResult {
  const text = rawText.trim();
  const t = text.toLowerCase();

  if (/night mode/.test(t) || /raat (ka )?mode/.test(t)) {
    return finish(text, {
      command: "home.scene",
      action: "night_mode",
      authorization: "none",
      spokenReply: "Night mode. Lights dim, AC 24, TV off, security armed.",
    }, "home.scene", 0.92);
  }

  if (/compare/.test(t) || /muqabla/.test(t) || /side.?by.?side/.test(t)) {
    const cams = ["bedroom", "corridor"].filter((c) => t.includes(c) || (c === "corridor" && t.includes("corridor")));
    const cameras = cams.length >= 2 ? cams : ["bedroom", "corridor"];
    return finish(text, {
      command: "cctv.compare",
      cameras,
      layout: "side_by_side",
      authorization: "identity",
      spokenReply: `Comparing ${cameras.join(" and ")}.`,
    }, "cctv.compare", 0.9);
  }

  if (/grid/.test(t) || /saare camera/.test(t) || /all camera/.test(t)) {
    return finish(text, {
      command: "cctv.grid",
      layout: "grid",
      cameras: ["bedroom", "corridor", "entrance", "garage"],
      authorization: "identity",
      spokenReply: "All cameras in grid.",
    }, "cctv.grid", 0.88);
  }

  if (/cctv|camera|cam khol|feed/.test(t)) {
    const location = loc(t) ?? "bedroom";
    return finish(text, {
      command: "cctv.view",
      target: { type: "camera", location },
      cameras: [location],
      layout: "single",
      authorization: "identity",
      spokenReply: `Opening ${location} camera.`,
    }, "cctv.view", 0.9);
  }

  if (/shutdown|shut down|band kar do computer|restart|reboot/.test(t)) {
    const action = /restart|reboot/.test(t) ? "restart" : "shutdown";
    return finish(text, {
      command: "os.control",
      target: { type: "pc" },
      action,
      authorization: "required",
      spokenReply: `This action is destructive. Confirm ${action}.`,
    }, "os.control", 0.95);
  }

  if (/lock/.test(t) && /(pc|computer|laptop|system)/.test(t)) {
    return finish(text, {
      command: "os.control",
      target: { type: "pc" },
      action: "lock",
      authorization: "required",
      spokenReply: "Confirm lock workstation.",
    }, "os.control", 0.9);
  }

  if (/chrome|vs code|vscode|browser|downloads|screenshot|volume|wifi|wi-fi/.test(t)) {
    if (/volume|awaaz/.test(t)) {
      const value = brightness(t) ?? 50;
      return finish(text, {
        command: "os.control",
        action: "volume",
        value,
        authorization: "none",
        spokenReply: `Volume set to ${value} percent.`,
      }, "os.control", 0.9);
    }
    if (/screenshot/.test(t)) {
      return finish(text, {
        command: "os.control",
        action: "screenshot",
        authorization: "none",
        spokenReply: "Screenshot captured on the agent.",
      }, "os.control", 0.9);
    }
    if (/downloads/.test(t)) {
      return finish(text, {
        command: "os.control",
        action: "open_folder",
        target: { type: "folder", id: "downloads" },
        authorization: "identity",
        spokenReply: "Opening Downloads.",
      }, "os.control", 0.88);
    }
    if (/wifi|wi-fi/.test(t)) {
      return finish(text, {
        command: "os.control",
        action: "wifi_status",
        authorization: "none",
        spokenReply: "Wi-Fi is connected on the simulated agent.",
      }, "os.control", 0.85);
    }
    let application = "chrome";
    if (/vs code|vscode/.test(t)) application = "vscode";
    return finish(text, {
      command: "os.control",
      action: "open_application",
      target: { type: "application", application },
      authorization: "none",
      spokenReply: `Opening ${application}.`,
    }, "os.control", 0.9);
  }

  if (/light|lights|bulb|roshni/.test(t)) {
    const location = loc(t) ?? "bedroom";
    const value = brightness(t);
    const power = wantOn(t);
    const action = value !== undefined ? "brightness" : power === false ? "power_off" : "power_on";
    const spoken =
      action === "brightness"
        ? `${location} light ${value} percent.`
        : action === "power_off"
          ? `${location} lights off.`
          : `${location} lights on.`;
    return finish(text, {
      command: "device.control",
      target: { type: "light", location },
      action,
      value: value ?? (action === "power_off" ? 0 : 100),
      authorization: "none",
      spokenReply: `Done. ${spoken}`,
    }, "device.control", 0.93);
  }

  if (/\bac\b|air.?cond|cooler/.test(t)) {
    const location = loc(t) ?? "bedroom";
    const temp = brightness(t) ?? 24;
    return finish(text, {
      command: "device.control",
      target: { type: "ac", location },
      action: "set_temperature",
      value: temp,
      authorization: "none",
      spokenReply: `Done. ${location} AC at ${temp} degrees.`,
    }, "device.control", 0.9);
  }

  if (/fan/.test(t)) {
    const location = loc(t) ?? "bedroom";
    const power = wantOn(t) !== false;
    return finish(text, {
      command: "device.control",
      target: { type: "fan", location },
      action: power ? "power_on" : "power_off",
      authorization: "none",
      spokenReply: `Done. ${location} fan ${power ? "on" : "off"}.`,
    }, "device.control", 0.88);
  }

  if (/projector/.test(t)) {
    const on = wantOn(t) !== false;
    return finish(text, {
      command: "ui.control",
      action: on ? "projector_on" : "projector_off",
      authorization: "none",
      spokenReply: on ? "Interface moving to projector." : "Interface back to monitor.",
    }, "ui.control", 0.86);
  }

  if (/hand interface|gesture/.test(t)) {
    return finish(text, {
      command: "ui.control",
      action: "gesture_ui",
      authorization: "none",
      spokenReply: "Gesture interface armed.",
    }, "ui.control", 0.85);
  }

  if (/diag|status|health/.test(t)) {
    return finish(text, {
      command: "system.query",
      action: "diagnostics",
      authorization: "none",
      spokenReply: "All logic sectors nominal. Coherence coefficient 0.9998.",
    }, "system.query", 0.8);
  }

  const chat: CommandName = "chat";
  return finish(text, {
    command: chat,
    action: "reply",
    authorization: "none",
    spokenReply: "All systems operational. Command not mapped to a device action — treating as conversation.",
  }, "chat", 0.4);
}

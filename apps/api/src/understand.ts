import type { StructuredCommand, UnderstandResult } from "../../../core/protocol.ts";
import { normalizeLocation } from "./homeSim.ts";

const LOCATION_RE =
  /(bedroom|bed room|living room|living|lounge|corridor|hall|entrance|garage|kitchen|room)/i;

function loc(text: string, fallback = "bedroom") {
  const m = text.match(LOCATION_RE);
  return normalizeLocation(m ? m[1] : fallback);
}

function percent(text: string): number | undefined {
  const m = text.match(/(\d{1,3})\s*(%|percent|degree|degrees)?/i);
  if (!m) return undefined;
  return Math.max(0, Math.min(100, Number(m[1])));
}

function reply(command: StructuredCommand, confidence: number, intent: string): UnderstandResult {
  return { intent, command, confidence };
}

export function understandLocal(text: string): UnderstandResult {
  const t = text.toLowerCase().trim();

  if (/night mode|raat ka mode|good night/.test(t)) {
    return reply(
      {
        command: "home.scene",
        action: "night_mode",
        authorization: "none",
        spokenReply: "Night mode activated. Lights dimmed, AC at 24, TV off.",
      },
      0.92,
      "home.scene",
    );
  }

  if (/compare|muqabla|side by side/.test(t)) {
    const locs = [...t.matchAll(new RegExp(LOCATION_RE, "gi"))].map((m) => normalizeLocation(m[1]));
    const cameras = locs.length >= 2 ? locs.slice(0, 2) : ["bedroom", "corridor"];
    return reply(
      {
        command: "cctv.compare",
        action: "side_by_side",
        value: { cameras },
        authorization: "none",
        spokenReply: `Opening ${cameras[0]} and ${cameras[1]} side by side.`,
      },
      0.88,
      "cctv.compare",
    );
  }

  if (/grid|saare cameras|all cameras/.test(t)) {
    return reply(
      {
        command: "cctv.grid",
        action: "grid",
        authorization: "none",
        spokenReply: "Showing all cameras in a grid.",
      },
      0.9,
      "cctv.grid",
    );
  }

  if (/cctv|camera|cam khol/.test(t)) {
    const location = loc(t, "bedroom");
    return reply(
      {
        command: "cctv.view",
        target: { type: "camera", location },
        action: "live",
        authorization: "none",
        spokenReply: `Opening ${location} camera live view.`,
      },
      0.86,
      "cctv.view",
    );
  }

  if (/shutdown|shut down|band kar do computer|pc band/.test(t)) {
    return reply(
      {
        command: "system.power",
        target: { type: "pc" },
        action: "shutdown",
        authorization: "required",
        spokenReply: "This action is destructive. Please confirm shutdown.",
      },
      0.95,
      "system.power",
    );
  }

  if (/restart|reboot/.test(t)) {
    return reply(
      {
        command: "system.power",
        target: { type: "pc" },
        action: "restart",
        authorization: "required",
        spokenReply: "Restart is a high-risk action. Please confirm.",
      },
      0.93,
      "system.power",
    );
  }

  if (/screenshot|screen shot/.test(t)) {
    return reply(
      {
        command: "device.control",
        target: { type: "pc" },
        action: "screenshot",
        authorization: "none",
        spokenReply: "Screenshot captured.",
      },
      0.9,
      "device.control",
    );
  }

  if (/volume|awaaz/.test(t)) {
    const value = percent(t) ?? 50;
    return reply(
      {
        command: "device.control",
        target: { type: "pc" },
        action: "volume",
        value,
        authorization: "none",
        spokenReply: `Volume set to ${value} percent.`,
      },
      0.9,
      "device.control",
    );
  }

  if (/kholo|open|launch/.test(t) && /(chrome|vscode|vs code|explorer|notepad)/.test(t)) {
    const app = t.match(/chrome|vs code|vscode|explorer|notepad/)![0];
    return reply(
      {
        command: "device.control",
        target: { type: "pc", application: app },
        action: "open_application",
        authorization: "none",
        spokenReply: `Opening ${app}.`,
      },
      0.9,
      "device.control",
    );
  }

  if (/diagnostics|status|system check|kya haal/.test(t)) {
    return reply(
      {
        command: "system.info",
        action: "diagnostics",
        authorization: "none",
        spokenReply: "All systems operational. Logic sectors nominal.",
      },
      0.8,
      "system.info",
    );
  }

  if (/overkill|overclock/.test(t)) {
    return reply(
      {
        command: "ui.mode",
        action: "overkill",
        authorization: "none",
        spokenReply: "Overkill mode toggled.",
      },
      0.85,
      "ui.mode",
    );
  }

  if (/(light|lights|roshni)/.test(t)) {
    const location = loc(t, "bedroom");
    const value = percent(t);
    const off = /\boff\b|band kar|bujha/.test(t);
    const on = /\bon\b|jala|chalao/.test(t) && value === undefined;
    if (off) {
      return reply(
        {
          command: "device.control",
          target: { type: "light", location },
          action: "power",
          value: false,
          authorization: "none",
          spokenReply: `${location.replace("_", " ")} light is off.`,
        },
        0.9,
        "device.control",
      );
    }
    if (value !== undefined) {
      return reply(
        {
          command: "device.control",
          target: { type: "light", location },
          action: "brightness",
          value,
          authorization: "none",
          spokenReply: `Done. ${location.replace("_", " ")} light ${value} percent par hai.`,
        },
        0.93,
        "device.control",
      );
    }
    if (on) {
      return reply(
        {
          command: "device.control",
          target: { type: "light", location },
          action: "power",
          value: true,
          authorization: "none",
          spokenReply: `${location.replace("_", " ")} lights on.`,
        },
        0.9,
        "device.control",
      );
    }
  }

  if (/fan/.test(t)) {
    const location = loc(t, "bedroom");
    const off = /\boff\b|band kar/.test(t);
    return reply(
      {
        command: "device.control",
        target: { type: "fan", location },
        action: "power",
        value: !off,
        authorization: "none",
        spokenReply: `${location.replace("_", " ")} fan ${off ? "off" : "on"}.`,
      },
      0.88,
      "device.control",
    );
  }

  if (/projector/.test(t)) {
    const off = /\boff\b|band/.test(t);
    return reply(
      {
        command: "ui.mode",
        action: off ? "monitor" : "projector",
        authorization: "none",
        spokenReply: off ? "Interface on monitor." : "Interface moving to projector.",
      },
      0.86,
      "ui.mode",
    );
  }

  if (/\bac\b|air con|temperature/.test(t)) {
    const location = loc(t, "bedroom");
    const value = percent(t) ?? 24;
    return reply(
      {
        command: "device.control",
        target: { type: "ac", location },
        action: "set_temperature",
        value,
        authorization: "none",
        spokenReply: `AC set to ${value} degrees.`,
      },
      0.88,
      "device.control",
    );
  }

  return reply(
    {
      command: "conversation.reply",
      action: "chat",
      value: t,
      authorization: "none",
      spokenReply: "All systems operational. Aur aap kaise hain?",
    },
    0.4,
    "conversation.reply",
  );
}

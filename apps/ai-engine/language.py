from __future__ import annotations

import re
from typing import Any

LOCATION_RE = re.compile(
    r"(bedroom|bed room|living room|living|lounge|corridor|hall|entrance|garage|kitchen|room)",
    re.I,
)


def _loc(text: str, fallback: str = "bedroom") -> str:
    m = LOCATION_RE.search(text)
    raw = (m.group(1) if m else fallback).lower()
    if "living" in raw or "lounge" in raw:
        return "living_room"
    if "bed" in raw or raw == "room":
        return "bedroom"
    return raw.replace(" ", "_")


def _percent(text: str) -> int | None:
    m = re.search(r"(\d{1,3})\s*(%|percent|degree|degrees)?", text, re.I)
    if not m:
        return None
    return max(0, min(100, int(m.group(1))))


def _cmd(command: str, action: str, **kwargs: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "command": command,
        "action": action,
        "authorization": kwargs.pop("authorization", "none"),
    }
    payload.update(kwargs)
    return payload


def understand(text: str) -> dict[str, Any]:
    t = text.lower().strip()

    if re.search(r"night mode|raat ka mode|good night", t):
        c = _cmd(
            "home.scene",
            "night_mode",
            spokenReply="Night mode activated. Lights dimmed, AC at 24, TV off.",
        )
        return {"intent": "home.scene", "command": c, "confidence": 0.92}

    if re.search(r"compare|side by side", t):
        locs = [_loc(m.group(1)) for m in LOCATION_RE.finditer(t)]
        if len(locs) >= 2:
            c = _cmd(
                "cctv.compare",
                "side_by_side",
                value={"cameras": locs[:2]},
                spokenReply=f"Opening {locs[0]} and {locs[1]} side by side.",
            )
            return {"intent": "cctv.compare", "command": c, "confidence": 0.88}

    if re.search(r"grid|saare cameras|all cameras", t):
        c = _cmd("cctv.grid", "grid", spokenReply="Showing all cameras in a grid.")
        return {"intent": "cctv.grid", "command": c, "confidence": 0.9}

    if re.search(r"cctv|camera|cam khol", t):
        location = _loc(t)
        c = _cmd(
            "cctv.view",
            "live",
            target={"type": "camera", "location": location},
            spokenReply=f"Opening {location} camera live view.",
        )
        return {"intent": "cctv.view", "command": c, "confidence": 0.86}

    if re.search(r"shutdown|shut down|pc band", t):
        c = _cmd(
            "system.power",
            "shutdown",
            target={"type": "pc"},
            authorization="required",
            spokenReply="This action is destructive. Please confirm shutdown.",
        )
        return {"intent": "system.power", "command": c, "confidence": 0.95}

    if "volume" in t or "awaaz" in t:
        value = _percent(t) or 50
        c = _cmd(
            "device.control",
            "volume",
            target={"type": "pc"},
            value=value,
            spokenReply=f"Volume set to {value} percent.",
        )
        return {"intent": "device.control", "command": c, "confidence": 0.9}

    if re.search(r"kholo|open|launch", t) and re.search(r"chrome|vscode|vs code|explorer|notepad", t):
        app = re.search(r"chrome|vs code|vscode|explorer|notepad", t).group(0)
        c = _cmd(
            "device.control",
            "open_application",
            target={"type": "pc", "application": app},
            spokenReply=f"Opening {app}.",
        )
        return {"intent": "device.control", "command": c, "confidence": 0.9}

    if re.search(r"light|lights|roshni", t):
        location = _loc(t)
        value = _percent(t)
        if re.search(r"\boff\b|band kar|bujha", t):
            c = _cmd(
                "device.control",
                "power",
                target={"type": "light", "location": location},
                value=False,
                spokenReply=f"{location.replace('_', ' ')} light is off.",
            )
            return {"intent": "device.control", "command": c, "confidence": 0.9}
        if value is not None:
            c = _cmd(
                "device.control",
                "brightness",
                target={"type": "light", "location": location},
                value=value,
                spokenReply=f"Done. {location.replace('_', ' ')} light {value} percent par hai.",
            )
            return {"intent": "device.control", "command": c, "confidence": 0.93}
        if re.search(r"\bon\b|jala|chalao", t):
            c = _cmd(
                "device.control",
                "power",
                target={"type": "light", "location": location},
                value=True,
                spokenReply=f"{location.replace('_', ' ')} lights on.",
            )
            return {"intent": "device.control", "command": c, "confidence": 0.9}

    if re.search(r"\bac\b|air con|temperature", t):
        location = _loc(t)
        value = _percent(t) or 24
        c = _cmd(
            "device.control",
            "set_temperature",
            target={"type": "ac", "location": location},
            value=value,
            spokenReply=f"AC set to {value} degrees.",
        )
        return {"intent": "device.control", "command": c, "confidence": 0.88}

    c = _cmd(
        "conversation.reply",
        "chat",
        value=t,
        spokenReply="All systems operational. Aur aap kaise hain?",
    )
    return {"intent": "conversation.reply", "command": c, "confidence": 0.4}

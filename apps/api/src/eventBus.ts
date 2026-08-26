export type EventName =
  | "WAKE_WORD_DETECTED"
  | "VOICE_COMMAND"
  | "FACE_RECOGNIZED"
  | "GESTURE_DETECTED"
  | "EMOTION_CHANGED"
  | "CAMERA_CONNECTED"
  | "DEVICE_OFFLINE"
  | "COMMAND_EXECUTED"
  | "COMMAND_DENIED"
  | "COMMAND_PENDING";

export interface HolmevEvent {
  type: EventName;
  at: string;
  payload: Record<string, unknown>;
}

type Listener = (event: HolmevEvent) => void;

const listeners = new Set<Listener>();
const history: HolmevEvent[] = [];

export function publish(type: EventName, payload: Record<string, unknown>): HolmevEvent {
  const event: HolmevEvent = { type, at: new Date().toISOString(), payload };
  history.push(event);
  if (history.length > 200) history.shift();
  for (const l of listeners) l(event);
  return event;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function recentEvents(): HolmevEvent[] {
  return [...history];
}

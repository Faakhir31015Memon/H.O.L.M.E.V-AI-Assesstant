type Listener = (event: string, payload: unknown) => void;

const listeners = new Set<Listener>();

export function emit(event: string, payload: unknown) {
  for (const fn of listeners) fn(event, payload);
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

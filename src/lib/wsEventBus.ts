"use client";

type WSMessage = Record<string, unknown>;
type Listener = (msg: WSMessage) => void;

export interface EventEntry {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

const listeners = new Set<Listener>();
const eventHistory: EventEntry[] = [];

export function emitWSEvent(msg: WSMessage) {
  eventHistory.unshift({
    type: msg.type as string,
    data: msg,
    timestamp: new Date().toLocaleTimeString(),
  });
  listeners.forEach((fn) => fn(msg));
}

export function onWSEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getEventHistory(): EventEntry[] {
  return eventHistory;
}

"use client";

import { createContext, useContext } from "react";
import { useWebSocket } from "@/lib/useWebSocket";

type WSMessage = Record<string, unknown>;

interface WebSocketContextValue {
  connected: boolean;
  messages: WSMessage[];
  send: (data: WSMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  connected: false,
  messages: [],
  send: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const ws = useWebSocket();
  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
}

export function useWS() {
  return useContext(WebSocketContext);
}

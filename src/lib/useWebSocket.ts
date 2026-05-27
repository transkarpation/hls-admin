"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { emitWSEvent } from "./wsEventBus";

type WSMessage = Record<string, unknown>;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[ws] message received:", data);
        emitWSEvent(data);
      } catch {
        // ignore non-JSON
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const send = useCallback((data: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}

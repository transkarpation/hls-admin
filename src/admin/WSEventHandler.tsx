"use client";

import { useEffect, useRef } from "react";
import { useNotify, useRefresh } from "react-admin";
import { useWS } from "./WebSocketProvider";

export function WSEventHandler() {
  const { messages } = useWS();
  const notify = useNotify();
  const refresh = useRefresh();
  const handled = useRef(0);

  useEffect(() => {
    const unhandled = messages.slice(handled.current);
    handled.current = messages.length;

    for (const msg of unhandled) {
      if (msg.type === "new.user") {
        const user = msg.user as { name: string; email: string };
        const creator = msg.createdBy as { name: string };
        console.log("[ws] new.user event:", { user, creator });
        notify(`${creator.name} created user ${user.name} (${user.email})`, {
          type: "info",
          autoHideDuration: 5000,
        });
        refresh();
      }
    }
  }, [messages, notify, refresh]);

  return null;
}

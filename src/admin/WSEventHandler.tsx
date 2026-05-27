"use client";

import { useEffect } from "react";
import { useRefresh } from "react-admin";
import { toast } from "react-toastify";
import { onWSEvent } from "@/lib/wsEventBus";

export function WSEventHandler() {
  const refresh = useRefresh();

  useEffect(() => {
    const unsub = onWSEvent((msg) => {
      console.log("[ws] event:", msg);
      if (msg.type === "user.created") {
        const user = msg.user as { name: string; email: string };
        const sender = msg.sender as { name: string; email: string };
        console.log("[ws] user.created event:", { user, sender });
        toast.info(
          `${sender.name} created user ${user.name} (${user.email})`,
          { autoClose: 5000 }
        );
        refresh();
      }
    });
    return unsub;
  }, [refresh]);

  return null;
}

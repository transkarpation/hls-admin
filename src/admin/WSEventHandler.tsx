"use client";

import { useEffect } from "react";
import { onWSEvent } from "@/lib/wsEventBus";

export function WSEventHandler() {
  const refresh = useRefresh();

  useEffect(() => {
    const unsub = onWSEvent((msg) => {
      console.log("[ws] event:", msg);
    });
    return unsub;
  }, []);

  return null;
}

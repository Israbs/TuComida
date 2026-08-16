"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "@/components/socket-provider";

export function useSocketEvent(
  event: string,
  handler: (payload: unknown) => void,
) {
  const socket = useSocket();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket) return;
    const listener = (payload: unknown) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}

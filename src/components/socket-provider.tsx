"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const s = io();
    const onConnect = () => setSocket(s);
    const onDisconnect = () => setSocket(null);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.disconnect();
      setSocket(null);
    };
  }, [status]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

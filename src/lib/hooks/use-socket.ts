"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
// Socket.IO connects through the same domain, with path under /api/
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

export function useSocket(token: string | null): Socket | null {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return socketRef.current;
}

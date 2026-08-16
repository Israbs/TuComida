import type { Server } from "socket.io";

declare global {
  var io: Server | undefined;
}

export function getIO(): Server | null {
  return globalThis.io ?? null;
}

export function emitToTenant(tenantId: string, event: string, payload: unknown) {
  getIO()?.to(`tenant:${tenantId}`).emit(event, payload);
}

import dotenv from "dotenv";
dotenv.config();

import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import next from "next";
import { Server } from "socket.io";
import { decode } from "next-auth/jwt";
import type { Socket } from "socket.io";
import "./src/lib/socket";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);

function getLanIPv4(): string | undefined {
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    const infos = ifaces[name];
    if (!infos) continue;
    if (/vEthernet|WSL|Virtual|VMware|VirtualBox|Loopback|Hyper-V|Default Switch/i.test(name))
      continue;
    for (const info of infos) {
      if (info.internal || info.family !== "IPv4") continue;
      if (info.address.startsWith("169.254.")) continue;
      return info.address;
    }
  }
  return undefined;
}

// El hostname que se pasa a `next()` se usa para construir las URLs absolutas
// (redirects de Auth.js, etc.). "0.0.0.0" NO es una URL válida para el navegador,
// así que cuando se pide modo red se usa la IP de la LAN. El binding al puerto
// (todas las interfaces) lo hace httpServer.listen(port) más abajo.
const envHostname = process.env.HOSTNAME;
const hostname =
  envHostname && envHostname !== "0.0.0.0" ? envHostname : getLanIPv4() ?? "localhost";

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function getCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

async function verifySession(cookieHeader: string | undefined) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  for (const name of SESSION_COOKIES) {
    const token = getCookie(cookieHeader, name);
    if (!token) continue;
    try {
      const jwt = await decode({ token, salt: name, secret });
      if (jwt?.tenantId) return jwt;
    } catch {
      // cookie no corresponde a este secret; probar el siguiente nombre
    }
  }
  return null;
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const jwt = await verifySession(socket.handshake.headers.cookie);
    if (!jwt) return next(new Error("Unauthorized"));
    socket.data.tenantId = jwt.tenantId;
    socket.data.userId = jwt.sub;
    next();
  });

  io.on("connection", (socket: Socket) => {
    const room = `tenant:${socket.data.tenantId}`;
    socket.join(room);
    console.log(`[socket] conectado: ${socket.id} -> ${room}`);
    socket.on("disconnect", () => {
      console.log(`[socket] desconectado: ${socket.id}`);
    });
  });

  globalThis.io = io;

  httpServer.listen(port, () => {
    console.log(`> TuComida listo en http://${hostname}:${port} (Socket.IO activo)`);
  });
});

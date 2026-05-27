import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { decode } from "next-auth/jwt";

const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
}

const globalForWss = globalThis as unknown as {
  __wss?: WebSocketServer;
};

function getWss(): WebSocketServer | null {
  return globalForWss.__wss ?? null;
}

async function authenticateRequest(
  req: IncomingMessage
): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    })
  );

  const secureName = "__Secure-authjs.session-token";
  const plainName = "authjs.session-token";
  const cookieName = cookies[secureName] ? secureName : plainName;
  const token = cookies[cookieName];
  if (!token) return null;

  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  try {
    const decoded = await decode({ token, secret, salt: cookieName });
    if (!decoded?.id) return null;
    return {
      id: decoded.id as string,
      email: decoded.email as string,
      name: decoded.name as string,
      role: decoded.role as string,
    };
  } catch {
    return null;
  }
}

export function startWebSocketServer() {
  if (globalForWss.__wss) return globalForWss.__wss;

  const wss = new WebSocketServer({ port: WS_PORT });
  globalForWss.__wss = wss;

  wss.on("connection", async (ws: AuthenticatedSocket, req) => {
    const user = await authenticateRequest(req);
    if (!user) {
      ws.close(4001, "Unauthorized");
      return;
    }

    ws.userId = user.id;
    ws.userEmail = user.email;
    ws.userName = user.name;
    ws.userRole = user.role;

    console.log(`[ws] ${user.email} connected`);

    ws.send(
      JSON.stringify({
        type: "connected",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      })
    );

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`[ws] ${user.email}:`, message);

        ws.send(JSON.stringify({ type: "ack", received: message }));
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      }
    });

    ws.on("close", () => {
      console.log(`[ws] ${user.email} disconnected`);
    });
  });

  console.log(`[ws] WebSocket server running on port ${WS_PORT}`);
  return wss;
}

export function getConnectedClients(): {
  id: string;
  email: string;
  role: string;
}[] {
  const wss = getWss();
  if (!wss) return [];
  const clients: { id: string; email: string; role: string }[] = [];
  wss.clients.forEach((ws) => {
    const s = ws as AuthenticatedSocket;
    if (s.userId) {
      clients.push({
        id: s.userId,
        email: s.userEmail!,
        role: s.userRole!,
      });
    }
  });
  return clients;
}

export function broadcast(data: unknown) {
  const wss = getWss();
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

export function broadcastToAdmins(data: unknown, excludeUserId?: string) {
  console.log("broadcastToAdmins")
  const wss = getWss();
  if (!wss) return;
  console.log("broadcastToAdmins2")

  const msg = JSON.stringify(data);
  wss.clients.forEach((ws) => {
    console.log("here")
    const s = ws as AuthenticatedSocket;
    if (
      s.readyState === WebSocket.OPEN &&
      s.userRole === "admin" &&
      s.userId !== excludeUserId
    ) {
      console.log("send ", msg)
      s.send(msg);
    }
  });
}

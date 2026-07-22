import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

// Helper function to send JSON payloads over WebSocket
function sendJson(socket, payload) {
  if (socket.readyState !== socket.OPEN) {
    return;
  }
  // If open , send the payload as a JSON string
  socket.send(JSON.stringify(payload));
}

// Broadcast a payload to all connected WebSocket clients
function broadcast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    client.send(JSON.stringify(payload));
  }
}

// Its also listen on port & handle REST request WHILE the web socket
// uses the same server to upgrade the connection to a WebSocket connection
// path -> representing websocket endpoint", keep ws separate from rest API routes
export function attacthWebSocketServer(server) {
  // ws will with server from path '/ws'
  // maxpayload : limit the maximum message from
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 10 * 1024 * 1024,
  }); // 10MB
  // if client connects to the webs ocket server, send a welcome message
  wss.on("connection", async (socket, req) => {
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit()
            ? "Rate limit exceeded"
            : "Access denied";

          socket.close(code, reason);
          return;
        }
      } catch (e) {
        console.error("WS connection error", e);
        socket.close(1011, "Server security error");
        return;
      }
    }

    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    sendJson(socket, { type: "welcome" });

    socket.on("error", console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 3000);

  wss.on("close", () => clearInterval(interval));

  // retuern a clean function
  function broadcastMatchCreated(match) {
    broadcast(wss, { type: "match_created", data: match });
  }

  return { broadcastMatchCreated };
}

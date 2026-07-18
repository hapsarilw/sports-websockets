import { WebSocket, WebSocketServer } from "ws";

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
    const wss = new WebSocketServer({ server,  path: '/ws', maxPayload: 10 * 1024 * 1024 }); // 10MB
    // if client connects to the websocket server, send a welcome message
    wss.on('connection', (socket) => {
        sendJson(socket, {type: 'welcome', message: 'Welcome to the WebSocket server!'});
        // Handle socket from crashing on bad connectuon
        socket.on('error', console.error);
    });

    // retuern a clean function
    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match_created', data: match }); 
    }

    return { broadcastMatchCreated };

}

import express from "express";
import http from 'http';
import {matchRouter} from "./routes/matches.js";
import { attacthWebSocketServer } from "./ws/server.js";

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
// http routes & websocket upgrades to coexist on one port
const server = http.createServer(app);

// Enable middleware to understand JSON data
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from Express server!");
});

app.use('/matches', matchRouter);
 
// initialize web socket
const { broadcastMatchCreated } = attacthWebSocketServer(server);
// can store into locals to be accessible in routes
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST,  () => {
  const baseUrl = HOST === '0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(`WebSocket server is running on ${baseUrl.replace('http', 'ws')}/ws`);
});

 
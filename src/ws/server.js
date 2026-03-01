import WebSocket from "ws";
import { WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket, payload){
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss,payload){
    for(const client of wss.clients){
        if(client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024
  });

  // Validate WebSocket upgrade requests with Arcjet before the handshake
  server.on('upgrade', async (req, socket, head) => {
    if (!wsArcjet) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
      return;
    }

    try {
      const decision = await wsArcjet.protect(req);
      if (decision.isDenied()) {
        const status = decision.reason.isRateLimit() ? 429 : 403;
        const message = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Access denied';
        const statusText = status === 429 ? 'Too Many Requests' : 'Forbidden';
        const res = `HTTP/1.1 ${status} ${statusText}\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`;
        try { socket.write(res); } catch (err) {}
        socket.destroy();
        return;
      }

      // Allowed — proceed with the WebSocket handshake
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    } catch (e) {
      console.error('WS upgrade error', e);
      const message = 'Internal server error';
      const res = `HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`;
      try { socket.write(res); } catch (err) {}
      socket.destroy();
    }
  });

  // Connection handler no longer performs pre-handshake validation — it assumes the upgrade was validated
  wss.on('connection', (socket, request) => {
    socket.isAlive = true;

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    sendJson(socket, { type: 'welcome' });

    socket.on('error', console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  function broadcastMatchCreated(match) {
    broadcast(wss, { type: 'match_created', data: match });
  }

  return { broadcastMatchCreated };
}
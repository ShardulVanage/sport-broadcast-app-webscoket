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

  wss.on('connection', async (socket,request) => {
    if(wsArcjet){
      try{
         const decision = await wsArcjet.protect({request});
        if(decision.isDenied()){
          const code = decision.reason.isRateLimit() ? 1003 : 1008; // 1008: Policy Violation, 1003: Unsupported Data
          const reason = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Access denied';
          socket.close(code, reason);
          return;
        }
      }catch(e){
        console.error('WS connection error', e);
        // close with a generic policy violation if we hit an unexpected error
        socket.close(1008, 'Internal server error');
        return;
      }
    }
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
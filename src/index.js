import 'dotenv/config'; 
import express from 'express';
import http from 'http';
import { matchRouter } from './routes/matches.js';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';
import { commentaryRouter } from './routes/commentary.js';
if (process.env.NODE_ENV !== 'production') {
  console.log('ARCJET_ENV:', process.env.ARCJET_ENV);
  console.log('ARCJET_KEY:', process.env.ARCJET_KEY ? 'set ✅' : 'missing ❌');
}



const PORT = Number(process.env.PORT || 8000) ;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server= http.createServer(app);

app.use(express.json());

app.get('/', (req, res) => {
    res.send({ message: 'Server is running' });
});

app.use(securityMiddleware());

app.use('/matches',matchRouter)
app.use('/matches/:id/commentary', commentaryRouter);

const {broadcastMatchCreated} = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;


server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === '0.0.0.0'
      ? `http://localhost:${PORT}`
      : `http://${HOST}:${PORT}`;

  console.log(`Server started at ${baseUrl}`);
  console.log(`WebSocket Server is Running on ${baseUrl.replace('http', 'ws')}/ws`);
});
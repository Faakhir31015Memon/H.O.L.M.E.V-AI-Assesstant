import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { HolmevEngine } from './engine';
import { systemRoutes } from './routes';
import { Worker, Job } from 'bullmq';
import { connection } from './queues';

const fastify = Fastify({ logger: true });

// Register fastify WebSocket & CORS
fastify.register(cors, { origin: '*' });
fastify.register(websocket);

// Register API REST routes
fastify.register(systemRoutes);

const engine = HolmevEngine.getInstance();

// Setup WebSocket endpoint /ws/hud
fastify.register(async function (fastify) {
  fastify.get('/ws/hud', { websocket: true }, (connection, req) => {
    const clientId = `client_${Math.random().toString(36).substr(2, 9)}`;
    fastify.log.info(`New HUD WS client registered: ${clientId}`);
    engine.registerClient(clientId, connection);
  });
});

// Setup mock BullMQ Workers to track job completions
new Worker(
  'aiTaskQueue',
  async (job: Job) => {
    fastify.log.info(`Processing NLP AI Task Job ID: ${job.id}`);
    // Simulating deep network prediction computations
    await new Promise((res) => setTimeout(res, 2000));
    
    engine.broadcast({
      event: 'JOB_COMPLETED',
      data: { jobId: job.id, result: 'AI logic processing completed.' },
      timestamp: Date.now(),
    });
    engine.transitionTo('IDLE');
  },
  { connection }
);

new Worker(
  'systemActionQueue',
  async (job: Job) => {
    fastify.log.info(`Processing OS Automation System Action Job ID: ${job.id}`);
    await new Promise((res) => setTimeout(res, 1000));
    
    engine.broadcast({
      event: 'JOB_COMPLETED',
      data: { jobId: job.id, result: 'OS process executed successfully.' },
      timestamp: Date.now(),
    });
    engine.transitionTo('IDLE');
  },
  { connection }
);

// Server startup
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8000', 10);
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });
    fastify.log.info(`H.O.L.M.E.V. Main Gateway active on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

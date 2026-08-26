import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { HolmevEngine } from './engine';
import { dispatchAIPrompt, dispatchSystemAction } from './queues';

export async function systemRoutes(fastify: FastifyInstance) {
  const engine = HolmevEngine.getInstance();

  // 1. GET /api/v1/system/status
  fastify.get('/api/v1/system/status', async (req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'ONLINE',
      engineState: engine.getState(),
      timestamp: Date.now(),
    });
  });

  // 2. POST /api/v1/command/execute
  interface CommandBody {
    command: string;
    overkill?: boolean;
  }
  
  fastify.post('/api/v1/command/execute', async (req: FastifyRequest<{ Body: CommandBody }>, reply: FastifyReply) => {
    const { command, overkill = false } = req.body;

    if (!command) {
      return reply.status(400).send({ error: 'Command prompt parameter is required' });
    }

    // Set engine state to processing
    engine.transitionTo('PROCESSING');

    // Route based on command keywords
    if (command.toLowerCase().includes('system') || command.toLowerCase().includes('os')) {
      const job = await dispatchSystemAction('launch_process', { cmd: command });
      return reply.status(202).send({
        jobId: job.id,
        target: 'OS_CONTROLLER_AGENT',
        status: 'DISPATCHED',
      });
    }

    // Default to NLP processing
    const job = await dispatchAIPrompt(command, overkill);

    return reply.status(202).send({
      jobId: job.id,
      target: 'AI_VISION_FASTAPI',
      status: 'DISPATCHED',
    });
  });

  // 3. POST /api/v1/memory/query
  interface MemoryQueryBody {
    queryText: string;
    threshold?: number;
    limit?: number;
  }

  fastify.post('/api/v1/memory/query', async (req: FastifyRequest<{ Body: MemoryQueryBody }>, reply: FastifyReply) => {
    const { queryText, threshold = 0.85, limit = 5 } = req.body;

    if (!queryText) {
      return reply.status(400).send({ error: 'Query text parameter is required' });
    }

    // In a production setup, we would request an embedding of queryText from Python FastAPI
    // and query the PostgreSQL database with vector metrics. Here is the mock routing log.
    engine.broadcast({
      event: 'DATABASE_QUERY',
      data: { query: queryText, threshold, limit },
      timestamp: Date.now(),
    });

    // Simulated vector similarity return data matching pgvector indices
    return reply.status(200).send({
      query: queryText,
      matches: [
        {
          id: 'mem_a89',
          prompt_text: 'Active tritium containment wall updates',
          similarity: 0.948,
          metadata: { category: 'security' },
        },
        {
          id: 'mem_b04',
          prompt_text: 'Core quantum synchronization coefficient parameters',
          similarity: 0.887,
          metadata: { category: 'diagnostics' },
        }
      ],
      count: 2,
    });
  });
}

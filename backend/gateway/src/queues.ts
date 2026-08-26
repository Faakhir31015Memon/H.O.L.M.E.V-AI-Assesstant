import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

// Shared Redis connection parameters
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

export const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Define BullMQ Queues
export const aiTaskQueue = new Queue('aiTaskQueue', { connection });
export const videoProcessorQueue = new Queue('videoProcessorQueue', { connection });
export const systemActionQueue = new Queue('systemActionQueue', { connection });

// Interface representations for jobs
export interface AIJobData {
  prompt: string;
  contextId?: string;
  overkill?: boolean;
}

export interface VideoJobData {
  rtspUrl: string;
  frameIndex: number;
  quality: number;
}

export interface OSActionJobData {
  action: 'volume' | 'brightness' | 'metrics' | 'purge_cache' | 'launch_process';
  payload?: any;
}

// Function helper to dispatch jobs
export async function dispatchAIPrompt(prompt: string, overkill = false) {
  return await aiTaskQueue.add('processPrompt', {
    prompt,
    overkill,
    timestamp: Date.now(),
  });
}

export async function dispatchVideoFrame(rtspUrl: string, frameIndex: number) {
  return await videoProcessorQueue.add('analyzeFrame', {
    rtspUrl,
    frameIndex,
    quality: 85,
  });
}

export async function dispatchSystemAction(action: OSActionJobData['action'], payload?: any) {
  return await systemActionQueue.add('execOS', {
    action,
    payload,
  });
}

import { SocketStream } from '@fastify/websocket';

export type EngineState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'EXECUTING' | 'ERROR';

export interface TelemetryFrame {
  timestamp: number;
  cpu: number;
  gpu: number;
  neuralLoad: number;
  latency: number;
}

export interface ClientConnection {
  id: string;
  socketStream: SocketStream;
  lastPing: number;
}

export class HolmevEngine {
  private static instance: HolmevEngine;
  private state: EngineState = 'IDLE';
  private overkillMode = false;
  private connections: Map<string, ClientConnection> = new Map();
  private telemetryInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startTelemetryLoop();
  }

  public static getInstance(): HolmevEngine {
    if (!HolmevEngine.instance) {
      HolmevEngine.instance = new HolmevEngine();
    }
    return HolmevEngine.instance;
  }

  public getState(): EngineState {
    return this.state;
  }

  public setOverkillMode(enabled: boolean): void {
    this.overkillMode = enabled;
    this.broadcast({
      event: 'SYSTEM_SETTINGS',
      data: { overkillMode: this.overkillMode },
      timestamp: Date.now(),
    });
  }

  public transitionTo(newState: EngineState): void {
    const oldState = this.state;
    this.state = newState;
    
    // Broadcast transition log
    this.broadcast({
      event: 'STATE_TRANSITION',
      data: { from: oldState, to: newState },
      timestamp: Date.now(),
    });
  }

  public registerClient(id: string, socketStream: SocketStream): void {
    const connection: ClientConnection = {
      id,
      socketStream,
      lastPing: Date.now(),
    };
    
    this.connections.set(id, connection);
    
    // Send initial handshake state
    this.sendToClient(connection, {
      event: 'HANDSHAKE',
      data: {
        state: this.state,
        overkillMode: this.overkillMode,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });

    // Setup message event handlers
    socketStream.socket.on('message', (message: string) => {
      try {
        const frame = JSON.parse(message);
        this.handleIncomingFrame(connection, frame);
      } catch (e) {
        this.sendToClient(connection, {
          event: 'ERROR',
          data: { message: 'Invalid JSON payload stream' },
          timestamp: Date.now(),
        });
      }
    });

    socketStream.socket.on('close', () => {
      this.connections.delete(id);
    });
  }

  private handleIncomingFrame(client: ClientConnection, frame: any): void {
    const { event, data } = frame;

    switch (event) {
      case 'PING':
        client.lastPing = Date.now();
        this.sendToClient(client, { event: 'PONG', timestamp: Date.now() });
        break;
      
      case 'VOICE_INPUT':
        this.transitionTo('LISTENING');
        // Handle incoming raw audio streaming logic hook
        break;

      case 'CV_FRAME':
        // Handle custom dynamic Vision bounding logic hook
        break;

      default:
        console.warn(`Unrecognized frame event: ${event}`);
    }
  }

  public broadcast(payload: any): void {
    const rawPayload = JSON.stringify(payload);
    for (const [id, conn] of this.connections.entries()) {
      if (conn.socketStream.socket.readyState === 1) { // OPEN
        conn.socketStream.socket.send(rawPayload);
      }
    }
  }

  private sendToClient(conn: ClientConnection, payload: any): void {
    if (conn.socketStream.socket.readyState === 1) {
      conn.socketStream.socket.send(JSON.stringify(payload));
    }
  }

  private startTelemetryLoop(): void {
    this.telemetryInterval = setInterval(() => {
      if (this.connections.size === 0) return;

      const baseVal = this.overkillMode ? 80 : 15;
      const pulse: TelemetryFrame = {
        timestamp: Date.now(),
        cpu: Math.min(100, baseVal + Math.random() * 10),
        gpu: Math.min(100, (this.overkillMode ? 60 : 30) + Math.random() * 8),
        neuralLoad: Math.min(100, (this.state === 'PROCESSING' ? 90 : 40) + Math.random() * 12),
        latency: Math.floor(5 + Math.random() * 8),
      };

      this.broadcast({
        event: 'TELEMETRY_PULSE',
        data: pulse,
        timestamp: Date.now(),
      });
    }, 1500);
  }

  public stop(): void {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
  }
}

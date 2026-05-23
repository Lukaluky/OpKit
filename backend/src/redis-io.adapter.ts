import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

function getCorsOrigins(frontendUrl?: string): string[] {
  const origins = new Set<string>([
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);

  if (frontendUrl) {
    origins.add(frontendUrl);
  }

  return [...origins];
}

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    app: INestApplication,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const url = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const pubClient = createClient({ url });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const corsOrigins = getCorsOrigins(this.configService.get('FRONTEND_URL'));

    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: corsOrigins,
        credentials: true,
      },
    });

    server.adapter(this.adapterConstructor);
    return server;
  }
}

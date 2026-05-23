import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Task, TaskStatus } from '@prisma/client';
import { Server, Socket } from 'socket.io';

export type TaskStatusEvent = {
  id: string;
  status: TaskStatus;
  timestamp: string;
};

export type TaskDeletedEvent = {
  id: string;
  timestamp: string;
};

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  },
})
export class TasksGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.server = server;
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  notifyStatusChange(userId: string, payload: TaskStatusEvent) {
    this.server?.to(`user:${userId}`).emit('taskStatusUpdated', payload);
  }

  notifyTaskCreated(userId: string, task: Task) {
    this.server?.to(`user:${userId}`).emit('taskCreated', task);
  }

  notifyTaskDeleted(userId: string, payload: TaskDeletedEvent) {
    this.server?.to(`user:${userId}`).emit('taskDeleted', payload);
  }
}

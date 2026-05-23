import { io, Socket } from 'socket.io-client';

import { getApiUrl } from './config';
import { getToken } from './auth';
import type { Task, TaskDeletedEvent, TaskStatusEvent } from './types';

export type TaskSocketHandlers = {
  onStatusUpdate: (event: TaskStatusEvent) => void;
  onTaskCreated: (task: Task) => void;
  onTaskDeleted: (event: TaskDeletedEvent) => void;
};

let socket: Socket | null = null;

function bindHandlers(handlers: TaskSocketHandlers) {
  if (!socket) return;

  socket.off('taskStatusUpdated');
  socket.off('taskCreated');
  socket.off('taskDeleted');

  socket.on('taskStatusUpdated', handlers.onStatusUpdate);
  socket.on('taskCreated', handlers.onTaskCreated);
  socket.on('taskDeleted', handlers.onTaskDeleted);
}

export function connectSocket(handlers: TaskSocketHandlers) {
  const token = getToken();

  if (!socket) {
    socket = io(getApiUrl(), {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      auth: { token },
    });
  } else {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }

  bindHandlers(handlers);

  return () => {
    socket?.off('taskStatusUpdated', handlers.onStatusUpdate);
    socket?.off('taskCreated', handlers.onTaskCreated);
    socket?.off('taskDeleted', handlers.onTaskDeleted);
  };
}

export function reconnectSocket() {
  const token = getToken();
  if (!socket) return;
  socket.auth = { token };
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

import { getApiUrl } from './config';
import { getToken } from './auth';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function parseErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return 'Ошибка запроса';
  }
  const message = (body as { message?: string | string[] }).message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  if (typeof message === 'string') {
    return message;
  }
  return 'Ошибка запроса';
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  if (!response.ok) {
    let body: unknown = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }
    throw new ApiError(parseErrorMessage(body), response.status);
  }

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export const api = {
  register(email: string, password: string) {
    return request<{ accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  login(email: string, password: string) {
    return request<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getTasks() {
    return request<import('./types').Task[]>('/tasks');
  },

  createTask(title: string, description?: string) {
    return request<import('./types').Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  updateTask(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      status: import('./types').TaskStatus;
    }>,
  ) {
    return request<import('./types').Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteTask(id: string) {
    return request<void>(`/tasks/${id}`, { method: 'DELETE' });
  },
};

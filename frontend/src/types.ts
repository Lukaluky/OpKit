export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type TaskStatusEvent = {
  id: string;
  status: TaskStatus;
  timestamp: string;
};

export type TaskDeletedEvent = {
  id: string;
  timestamp: string;
};

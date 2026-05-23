import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, ApiError } from '../api';
import { clearToken, getToken, onAuthChange } from '../auth';
import { connectSocket, isSocketConnected, reconnectSocket } from '../socket';
import type { Task, TaskStatus } from '../types';

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'TODO', title: 'TODO' },
  { status: 'IN_PROGRESS', title: 'In progress' },
  { status: 'DONE', title: 'Done' },
];

const nextStatus: Partial<Record<TaskStatus, TaskStatus>> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
};

const prevStatus: Partial<Record<TaskStatus, TaskStatus>> = {
  IN_PROGRESS: 'TODO',
  DONE: 'IN_PROGRESS',
};

export function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [wsOk, setWsOk] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        navigate('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    void loadTasks();

    const cleanupSocket = connectSocket({
      onStatusUpdate: (event) => {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === event.id ? { ...task, status: event.status } : task,
          ),
        );
      },
      onTaskCreated: (task) => {
        setTasks((prev) => {
          if (prev.some((t) => t.id === task.id)) return prev;
          return [task, ...prev];
        });
      },
      onTaskDeleted: (event) => {
        setTasks((prev) => prev.filter((task) => task.id !== event.id));
      },
    });

    const cleanupAuth = onAuthChange((token) => {
      if (!token) {
        navigate('/login');
        return;
      }
      reconnectSocket();
      void loadTasks();
    });

    const tick = () => setWsOk(isSocketConnected());
    tick();
    const interval = window.setInterval(tick, 1000);

    return () => {
      cleanupSocket();
      cleanupAuth();
      window.clearInterval(interval);
    };
  }, [navigate, loadTasks]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Название не может быть пустым');
      return;
    }

    setError('');
    setBusyId('create');
    try {
      const task = await api.createTask(title.trim());
      setTasks((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        return [task, ...prev];
      });
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать задачу');
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    if (busyId) return;

    setError('');
    setBusyId(task.id);
    try {
      const updated = await api.updateTask(task.id, { status });
      setTasks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сменить статус');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (busyId) return;

    setError('');
    setBusyId(id);
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить задачу');
    } finally {
      setBusyId(null);
    }
  }

  function logout() {
    clearToken();
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="page">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="page tasks-page">
      <header className="tasks-header">
        <div>
          <h1>Мои задачи</h1>
          <span className={`ws-status ${wsOk ? 'ok' : ''}`}>
            {wsOk ? 'live' : 'offline'}
          </span>
        </div>
        <button type="button" onClick={logout}>
          Выйти
        </button>
      </header>

      <form onSubmit={handleCreate} className="form inline-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Новая задача"
          disabled={busyId === 'create'}
        />
        <button type="submit" disabled={busyId === 'create'}>
          {busyId === 'create' ? '...' : 'Добавить'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="board">
        {columns.map((col) => (
          <section key={col.status} className="column">
            <h2>{col.title}</h2>
            {tasks
              .filter((task) => task.status === col.status)
              .map((task) => (
                <article key={task.id} className="card">
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}
                  <div className="card-actions">
                    {prevStatus[task.status] && (
                      <button
                        type="button"
                        disabled={!!busyId}
                        onClick={() =>
                          changeStatus(task, prevStatus[task.status]!)
                        }
                      >
                        ← {prevStatus[task.status]}
                      </button>
                    )}
                    {nextStatus[task.status] && (
                      <button
                        type="button"
                        disabled={!!busyId}
                        onClick={() =>
                          changeStatus(task, nextStatus[task.status]!)
                        }
                      >
                        → {nextStatus[task.status]}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() => handleDelete(task.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}

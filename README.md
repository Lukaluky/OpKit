



**Стек:** React (TypeScript), NestJS, PostgreSQL, Prisma, Redis, Socket.IO.

## Требования





## Быстрый старт (рекомендуется)

```bash
git clone <url-репозитория>
корне

docker compose up --build
```

Первый запуск займёт несколько минут (скачивание образов и сборка).

| Сервис   | URL |
|----------|-----|
| Приложение (UI) | http://localhost:8080 |
| API (напрямую)  | http://localhost:3000 |

1. Открой http://localhost:8080  
2. Зарегистрируйся  
3. Создавай задачи, меняй статусы  

Остановка:

```bash
docker compose down
```

Сброс базы данных:

```bash
docker compose down -v
```

## Порты

| Порт | Назначение |
|------|------------|
| 8080 | Frontend (nginx) |
| 3000 | Backend API |
| 5437 | PostgreSQL (для локальной разработки) |
| 6379 | Redis |

Если порт занят — останови другой процесс или измени маппинг в `docker-compose.yml`.

## Структура проекта

```
.
├── backend/          NestJS, Prisma, WebSocket
├── frontend/         React + Vite
├── docker-compose.yml
└── README.md
```

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /auth/register | Регистрация |
| POST | /auth/login | Вход, JWT |
| GET | /tasks | Список задач |
| POST | /tasks | Создать задачу |
| PATCH | /tasks/:id | Обновить / статус |
| DELETE | /tasks/:id | Удалить |

Защищённые роуты: заголовок `Authorization: Bearer <token>`.

**WebSocket** (через тот же хост, что UI):

- `taskCreated` — новая задача  
- `taskDeleted` — удаление  
- `taskStatusUpdated` — смена статуса (`id`, `status`, `timestamp`)  

Redis используется как pub/sub для Socket.IO (`backend/src/redis-io.adapter.ts`).

## Real-time

1. Войди в аккаунт на http://localhost:8080  
2. Открой вторую вкладку с тем же адресом (`/tasks`)  
3. В шапке должно быть **live**  
4. Создай задачу или смени статус в одной вкладке — изменения появятся в другой  

Статусы: TODO ↔ IN_PROGRESS ↔ DONE (вперёд и назад).

## Локальная разработка (без Docker для app)

Только БД и Redis в Docker:

```bash
docker compose up -d postgres redis
```

**Backend:**

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

**Frontend:**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

UI: http://localhost:5173 (прокси на API в `vite.config.ts`).

## Тесты

```bash
cd backend
npm install
npm test
```

## Переменные окружения

В Docker всё задано в `docker-compose.yml`. Для локального запуска:

- `backend/.env.example` → `backend/.env`  
- `frontend/.env.example` → `frontend/.env`  

## Частые проблемы

**Порт 3000 занят** — останови локальный `npm run start:dev` или другой сервис на 3000.

**Во второй вкладке просит логин** — используй тот же адрес (`localhost`, не `127.0.0.1`). Войди в первой вкладке, обнови вторую.

**`docker compose` не найден** — установи Docker Desktop или используй `docker-compose` (старая версия).

**Сборка падает на Windows** — включи WSL2 в Docker Desktop, перезапусти Docker.

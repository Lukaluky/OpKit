











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



## Real-time

1. Войди в аккаунт на http://localhost:8080  
2. Открой вторую вкладку с тем же адресом (`/tasks`)  
3. В шапке должно быть **live**  
4. Создай задачу или смени статус в одной вкладке — изменения появятся в другой  

Статусы: TODO ↔ IN_PROGRESS ↔ DONE (вперёд и назад).



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









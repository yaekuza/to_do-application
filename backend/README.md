# Backend — Go REST API

Stateless JSON API for tasks, categories, and profile. Verifies Supabase JWTs and talks to the same Postgres database via `pgx`.

## Prerequisites

- Go 1.22 or newer
- A configured Supabase project (see [../supabase/README.md](../supabase/README.md))

## Setup

```bash
cd backend
cp .env.example .env
# fill in DATABASE_URL, SUPABASE_JWT_SECRET, FRONTEND_ORIGIN
go mod tidy
go run .
```

The server listens on `:8080` by default (override with `PORT`).

## Environment variables

| Name | Description |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (Settings → Database → URI) |
| `SUPABASE_JWT_SECRET` | Used to verify the HS256 access tokens issued by Supabase Auth |
| `FRONTEND_ORIGIN` | Allowed CORS origin, e.g. `http://localhost:5173` |
| `PORT` | Optional, defaults to `8080` |

## Endpoints

All `/api/*` routes require `Authorization: Bearer <supabase-access-token>`.

| Method | Path | Notes |
|---|---|---|
| GET    | `/healthz` | Public liveness check |
| GET    | `/api/profile` | Returns the caller's profile |
| PUT    | `/api/profile` | Update display name, username, bio, avatar |
| GET    | `/api/categories` | List the caller's categories |
| POST   | `/api/categories` | Create category (name, color) |
| PUT    | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |
| GET    | `/api/tasks` | List tasks (optional `?from=...&to=...` ISO range) |
| POST   | `/api/tasks` | Create a task |
| PUT    | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |

## Layout

```
backend/
├── main.go                      Entry point + graceful shutdown
├── internal/
│   ├── config/config.go         Env loading
│   ├── db/db.go                 pgx pool
│   ├── middleware/
│   │   ├── auth.go              Supabase JWT verification
│   │   └── cors.go              CORS for the SPA
│   ├── models/models.go         Domain structs
│   └── handlers/
│       ├── profile.go
│       ├── categories.go
│       └── tasks.go
└── go.mod
```

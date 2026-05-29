# TakenHandelaar

A full-stack task manager for students. Plan school work on a weekly calendar, sort by subject, track priority and progress.

- **Frontend:** React 18 + Vite, vanilla CSS (dark theme, neon purple accent)
- **Backend:** Go 1.22 (`net/http`), connects to Supabase Postgres via `pgx`
- **Auth + DB:** Supabase (Email + Google OAuth + Discord OAuth)

---

## Repository layout

```
.
├── backend/        Go REST API (tasks, categories, profile)
├── frontend/       React app (Vite)
├── supabase/       SQL schema and RLS policies
└── README.md       You are here
```

Each subproject has its own README with setup steps.

---

## Quick start

You will need: Node 20+, Go 1.22+, and a free Supabase project (https://supabase.com).

1. **Set up Supabase** — follow [supabase/README.md](supabase/README.md). This is required first because both apps need the project URL and keys.
2. **Backend** — see [backend/README.md](backend/README.md). Run with `go run .` on port 8080.
3. **Frontend** — see [frontend/README.md](frontend/README.md). Run with `npm run dev` on port 5173.

Open http://localhost:5173 and log in with email, Google, or Discord.

---

## Architecture

```
 ┌──────────────┐    OAuth + JWT     ┌──────────────┐
 │ React (Vite) │ ─────────────────► │   Supabase   │
 │              │ ◄───────────────── │ Auth + Postgres│
 └──────┬───────┘   session token    └──────▲───────┘
        │                                   │
        │ Authorization: Bearer <jwt>       │ pgx (DATABASE_URL)
        ▼                                   │
 ┌──────────────┐                           │
 │ Go REST API  │ ──────────────────────────┘
 └──────────────┘
```

- The frontend talks to **Supabase directly** for sign-in/sign-up (email + Google + Discord).
- All business endpoints (`/api/tasks`, `/api/categories`, `/api/profile`) go through the **Go backend**, which verifies the Supabase JWT and reads/writes the same Postgres database.
- Row Level Security is on in Postgres as a second line of defense — even if a token leaks, each user only sees their own rows.

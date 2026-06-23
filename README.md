# TakenHandelaar

A full-stack task manager for students. Plan school work on a weekly calendar, keep notes, track priority, and review completion progress.

- **Frontend:** React 18 + Vite, vanilla CSS (dark theme, neon purple accent)
- **Backend:** Go 1.22 (`net/http`), connects to Supabase Postgres via `pgx`
- **Auth + DB:** Supabase (Email + Google OAuth + Discord OAuth)

---

## Repository layout

```
.
├── backend/        Optional Go REST API
├── frontend/       React app (Vite)
├── supabase/       SQL schema and RLS policies
└── README.md       You are here
```

Each subproject has its own README with setup steps.

---

## Quick start

You will need: Node 20+ and a free Supabase project (https://supabase.com). Go 1.22+ is only needed if you want to run the optional backend.

1. **Set up Supabase** — follow [supabase/README.md](supabase/README.md). This is required first because both apps need the project URL and keys.
2. **Frontend** — see [frontend/README.md](frontend/README.md). Run with `npm run dev` on port 5173.
3. **Optional backend** — see [backend/README.md](backend/README.md) if you want to run the Go API on port 8080.

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

- The frontend talks to **Supabase directly** for sign-in/sign-up and saving app data.
- The optional Go backend can also read/write the same database if needed.
- Row Level Security is on in Postgres as a second line of defense — even if a token leaks, each user only sees their own rows.

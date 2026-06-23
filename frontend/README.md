# Frontend — React + Vite

The UI: login / signup, dashboard, weekly calendar, notes, profile, and settings. Talks to Supabase directly for auth and data saves.

## Prerequisites

- Node 20+
- Supabase project (see [../supabase/README.md](../supabase/README.md))

## Setup

```bash
cd frontend
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```

Open http://localhost:5173.

## Environment variables

| Name | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable client key (`sb_publishable_...`) |

## Layout

```
frontend/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx              Root render + router
    ├── App.jsx               Route map (auth + protected app)
    ├── lib/
    │   ├── supabase.js       Supabase JS client
    │   └── api.js            Supabase data wrapper
    ├── context/
    │   └── AuthContext.jsx   Session state + sign-in helpers
    ├── components/
    │   ├── ProtectedRoute.jsx
    │   ├── Modal.jsx
    │   └── calendar/
    │       ├── WeekView.jsx
    │       ├── MiniCalendar.jsx
    ├── pages/
    │   ├── Auth.jsx          Login + sign up tabs
    │   ├── AuthCallback.jsx  OAuth redirect target
    │   ├── CalendarPage.jsx
    │   ├── DashboardPage.jsx
    │   ├── NotesPage.jsx
    │   ├── ProfilePage.jsx
    │   └── SettingsPage.jsx
    └── styles/
        ├── tokens.css        Color + spacing variables
        ├── globals.css
        ├── auth.css
        ├── shell.css
        ├── calendar.css
        ├── notes.css
        ├── settings.css
        └── profile.css
```

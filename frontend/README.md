# Frontend — React + Vite

The UI: login / signup, weekly calendar, categories, and profile. Talks to Supabase Auth directly and to the Go backend for everything else.

## Prerequisites

- Node 20+
- Supabase project (see [../supabase/README.md](../supabase/README.md))
- Go backend running (see [../backend/README.md](../backend/README.md))

## Setup

```bash
cd frontend
cp .env.example .env
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm install
npm run dev
```

Open http://localhost:5173.

## Environment variables

| Name | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |
| `VITE_API_URL` | Go backend base URL, e.g. `http://localhost:8080` |

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
    │   └── api.js            Fetch wrapper that injects the JWT
    ├── context/
    │   └── AuthContext.jsx   Session state + sign-in helpers
    ├── components/
    │   ├── ProtectedRoute.jsx
    │   ├── Sidebar.jsx       Left rail (Teams-style)
    │   ├── TopBar.jsx
    │   ├── Modal.jsx
    │   └── calendar/
    │       ├── WeekView.jsx
    │       ├── MiniCalendar.jsx
    │       └── TaskModal.jsx
    ├── pages/
    │   ├── Auth.jsx          Login + sign up tabs
    │   ├── AuthCallback.jsx  OAuth redirect target
    │   ├── CalendarPage.jsx
    │   ├── CategoriesPage.jsx
    │   └── ProfilePage.jsx
    └── styles/
        ├── tokens.css        Color + spacing variables
        ├── globals.css
        ├── auth.css
        ├── shell.css
        ├── calendar.css
        ├── categories.css
        └── profile.css
```

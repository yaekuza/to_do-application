# Supabase setup

This project uses Supabase for **auth** (email + Google + Discord) and the **Postgres database**. The Go backend connects to the same database via the connection string; the React frontend talks to Supabase Auth directly.

You need a Supabase account (free tier is enough): https://supabase.com.

---

## 1. Create the project

1. Sign in to https://app.supabase.com and click **New project**.
2. Pick a name (e.g. `takenhandelaar`), a strong DB password, and a region close to you.
3. Wait until provisioning finishes (~1 minute).

---

## 2. Run the schema

1. In the dashboard, go to **SQL Editor → New query**.
2. Open [`schema.sql`](schema.sql) in this folder, paste the whole file into the editor, and click **Run**.

This creates three tables (`profiles`, `categories`, `tasks`), enables Row Level Security, and adds a trigger so a `profiles` row is created automatically whenever someone signs up.

---

## 3. Collect the keys you will need

You need four values from the Supabase dashboard. Copy each one into the matching `.env` file (create the files first: `cp .env.example .env` in both `backend/` and `frontend/`).

> **Finding the settings page:** click the **gear icon** (⚙️) in the left sidebar, or look for **Project Settings** at the bottom of the sidebar. The exact label depends on your dashboard version.

### 3a. Project URL + anon key → `frontend/.env`

1. Go to **Project Settings** → look for **Data API** (older dashboards call it just **API**).
2. At the top you'll see **Project URL** — copy it into `VITE_SUPABASE_URL`.
3. Under **Project API keys**, find the key labelled `anon` / `public` — copy it into `VITE_SUPABASE_ANON_KEY`.

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_API_URL=http://localhost:8080
```

### 3b. JWT Secret → `backend/.env`

1. On the same **Data API** (or **API**) page, scroll down to the **JWT Settings** section.
2. Copy the **JWT Secret** into `SUPABASE_JWT_SECRET`.

### 3c. Database connection string → `backend/.env`

1. Still in **Project Settings**, click **Database** in the left sub-menu.
2. Look for **Connection string** (it may be under a "Connection info" or "Connection Pooling" panel, depending on your dashboard version).
3. Select the **URI** tab and copy the string. It looks like:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password you chose in step 1.
5. Paste it as `DATABASE_URL` in `backend/.env`.

> **Tip — can't find the password?** You can reset it on the same Database settings page under **Database Password**. If you reset it, update your `.env` to match.

Your final `backend/.env` should look like:

```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-...pooler.supabase.com:6543/postgres
SUPABASE_JWT_SECRET=your-jwt-secret-here
FRONTEND_ORIGIN=http://localhost:5173
PORT=8080
```

---

## 4. Enable Google OAuth

1. Create OAuth credentials in Google Cloud Console: https://console.cloud.google.com/apis/credentials
   - Application type: **Web application**
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. In the Supabase dashboard go to **Authentication → Providers → Google**, toggle it on, and paste the Client ID and Client Secret.

---

## 5. Enable Discord OAuth

1. Create an application at https://discord.com/developers/applications.
2. Under **OAuth2**, add the redirect: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Copy the Client ID and Client Secret.
4. In Supabase: **Authentication → Providers → Discord**, toggle on, paste the values.

---

## 6. Configure redirect URLs

In **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:5173`
- **Redirect URLs:** add `http://localhost:5173/auth/callback`

When you deploy, add the production URLs here too.

---

## 7. Email auth

Email/password is on by default. For local development you can also turn **off** email confirmation under **Authentication → Providers → Email** so you don't have to click a link in your inbox every time you sign up a test account.

---

That's it. Now follow [backend/README.md](../backend/README.md) and [frontend/README.md](../frontend/README.md).

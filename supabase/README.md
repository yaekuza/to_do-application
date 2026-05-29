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

Go to **Project Settings → API** and copy:

| Value | Where it goes |
|---|---|
| `Project URL`           | `frontend/.env` as `VITE_SUPABASE_URL` |
| `anon` public key       | `frontend/.env` as `VITE_SUPABASE_ANON_KEY` |
| `JWT Secret` (under JWT Settings) | `backend/.env` as `SUPABASE_JWT_SECRET` |

Go to **Project Settings → Database → Connection string → URI** and copy that into `backend/.env` as `DATABASE_URL`. Replace `[YOUR-PASSWORD]` with the DB password you set in step 1.

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

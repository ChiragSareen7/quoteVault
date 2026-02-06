# Supabase setup for QuoteVault (start to finish)

Follow these steps to set up a new Supabase project and run all SQL.

---

## 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Choose your **Organization** (or create one).
4. Set **Name** (e.g. `quotevault`), **Database password** (save it), and **Region**.
5. Click **Create new project** and wait for the project to be ready.

---

## 2. Get your API keys and URL

1. In the project, open **Project Settings** (gear icon in the sidebar).
2. Go to **API**.
3. Copy:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

You will use these in `.env.local` in the app.

---

## 3. Run the SQL (in order)

In the Supabase Dashboard, open **SQL Editor** and run the following **in this order**.

### Step 3.1 – Full schema (tables, RLS, triggers)

1. Click **New query**.
2. Open the file **`supabase/00-full-schema.sql`** from this repo and copy its entire contents.
3. Paste into the SQL Editor and click **Run** (or Cmd/Ctrl + Enter).
4. You should see “Success. No rows returned.”

This creates:

- `profiles` (with RLS)
- `quotes` (with RLS)
- `user_quotes` (with RLS)
- `favorites` (with RLS)
- `collections` (with RLS)
- `collection_quotes` (with RLS, supports both `quotes` and `user_quotes`)
- Triggers for `updated_at` and for creating a profile on signup

### Step 3.2 – Seed quotes

1. **New query** again.
2. Open **`supabase/seed.sql`** and copy its entire contents.
3. Paste into the SQL Editor and click **Run**.
4. You should see “Success” and many rows inserted (100+ quotes).

---

## 4. Configure Auth (optional but recommended)

1. In the Dashboard go to **Authentication** → **Providers**.
2. **Email** is enabled by default. Turn on **Confirm email** if you want verification.
3. For local dev you can leave **Confirm email** off.
4. Under **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (for local) or your production URL.
   - **Redirect URLs**: add `http://localhost:3000/**` and your production URL + `/**`.

---

## 5. App environment variables

In your app root (same folder as `package.json`), create or edit **`.env.local`**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
```

Replace with your **Project URL** and **anon public** key from step 2.

Optional (e.g. for password reset emails):

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 6. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should be able to sign up, browse quotes, add favorites, and create collections.

---

## If something goes wrong

### “Policy violation” or RLS errors

- Make sure you ran **`00-full-schema.sql`** completely and without errors.
- Check **Authentication** → **Policies** (or table RLS in **Table Editor**) to confirm policies exist for `profiles`, `favorites`, `collections`, `collection_quotes`, `user_quotes`.

### Profile not created on signup

- Run **`supabase/fix-signup-trigger.sql`** in the SQL Editor to recreate the `handle_new_user` trigger.

### Seeding quotes fails

- The seed script inserts into `quotes`. The table must exist and the `quotes` RLS policy must allow the role used by the SQL Editor (it runs with elevated privileges, so usually it’s fine). If you see “permission denied”, run the seed script again after confirming the schema ran successfully.

### Trigger syntax error (EXECUTE FUNCTION)

- Supabase uses PostgreSQL 11+. If you see an error about `EXECUTE FUNCTION`, try replacing it with `EXECUTE PROCEDURE` in the trigger definitions in `00-full-schema.sql`.

---

## Quick reference: files and order

| Order | File                    | Purpose                          |
|-------|-------------------------|----------------------------------|
| 1     | `supabase/00-full-schema.sql` | Tables, RLS, triggers, signup profile |
| 2     | `supabase/seed.sql`     | Insert 100+ quotes              |
| Fix   | `supabase/fix-signup-trigger.sql` | Recreate signup trigger if needed     |

That’s the full start-to-end Supabase setup and all SQL to run.

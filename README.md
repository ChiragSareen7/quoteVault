# QuoteVault 📜✨

QuoteVault is a full‑featured **quote discovery, collection, and personalization app** built as part of an AI‑first engineering assignment. The goal of this project is not only to deliver a polished product, but also to **demonstrate effective use of AI tools** (Cursor, ChatGPT, etc.) to design, build, debug, and document real‑world software.

---

## 🚀 Features Overview

### 1. Authentication & User Accounts

* Email/password sign up and login
* Secure logout and session persistence
* Password reset flow
* User profile with name and avatar
* Protected routes using middleware

**Tech:** Supabase Auth

---

### 2. Quote Browsing & Discovery

* Home feed with pagination / infinite scroll
* 100+ seeded quotes across categories:

  * Motivation
  * Love
  * Success
  * Wisdom
  * Humor
* Search quotes by keyword
* Filter quotes by author or category
* Pull‑to‑refresh behavior
* Graceful loading, empty, and error states
* Offline‑friendly caching

**Tech:** Supabase Postgres + React Query

---

### 3. Favorites & Collections (Cloud Sync)

* Save quotes to favorites
* Favorites persist across devices
* Create custom collections (e.g. *Morning Motivation*)
* Add/remove quotes from collections
* Optimistic UI updates
* Duplicate prevention and ownership enforcement

**Tech:** Supabase Database + Row Level Security (RLS)

---

### 4. Quote of the Day & Notifications

* Deterministic "Quote of the Day" logic
* Same quote shown to all users per day
* Prominently displayed on the home screen
* User‑selectable notification time
* Local notification scheduling with fallbacks

**Note:** Notification and widget behavior is documented clearly where platform limitations exist (web vs native).

---

### 5. Sharing & Export

* Share quote text via system share
* Generate shareable quote cards
* 3+ styled templates
* Save quote cards as images

**Tech:** Canvas / DOM‑to‑Image utilities

---

### 6. Personalization & Settings

* Light / Dark mode
* Multiple accent color themes
* Font size adjustment for quotes
* Preferences stored locally and synced to user profile
* Smooth transitions and animations

---

### 7. Widget Support

* Quote of the Day widget logic
* Daily refresh behavior
* Deep linking into the app
* Platform‑specific limitations documented

---

## 🧱 Tech Stack

### Frontend

* **Next.js (App Router)**
* **React**
* **Tailwind CSS**
* **shadcn/ui** (custom‑themed, no stock UI)
* **TanStack React Query**

### Backend

* **Supabase Auth**
* **Supabase Postgres**
* **Supabase Storage**

---

## 🗂 Project Structure

```
src/
 ├─ app/            # Routes and layouts
 ├─ components/     # Reusable UI components
 ├─ hooks/          # Custom React hooks
 ├─ lib/             # Supabase, auth, config
 ├─ styles/          # Global styles and themes
 └─ utils/           # Helpers and constants
```

---

## 🔐 Security Considerations

Security was treated as a **first‑class concern**:

* No hardcoded secrets
* All configuration via environment variables
* Supabase service role key never exposed to client
* Strict Row Level Security (RLS) on all tables
* User‑scoped database access enforced via policies
* Protected routes using middleware

---

## 🧾 Database Schema (Supabase)

Main tables:

* `quotes`
* `favorites`
* `collections`
* `collection_quotes`
* `profiles`

Each table has **Row Level Security enabled** with policies ensuring users can only access their own data.

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/quotevault.git
cd quotevault
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Setup

* Create a Supabase project
* Run provided SQL schema and RLS policies
* Seed the database with 100+ quotes

### 5. Run the App

```bash
npm run dev
```

---

## 🎨 Design Process

UI designs were created using **Figma Make / Stitch** with a focus on:

* Consistent design language
* Accessible typography and spacing
* Custom theming (no default component styles)

Designs were then translated into code using **shadcn/ui + Tailwind CSS**.

---

## 🤖 AI‑Assisted Development Workflow

This project intentionally embraces AI as a **development accelerator**:

### Tools Used

* **Cursor** – primary coding environment
* **ChatGPT / Claude** – architecture, edge cases, debugging
* **Figma Make / Stitch** – UI generation

### Workflow

1. Designed architecture and data models with AI
2. Used structured prompts to generate clean, modular code
3. Reviewed, refined, and secured AI output manually
4. Used AI to debug edge cases and improve UX
5. Documented tradeoffs and limitations transparently

AI was treated like a **junior engineer** — guided with clear prompts and reviewed critically.

---

## 📽 Loom Video

The Loom walkthrough covers:

* Full app demo
* Auth, browsing, favorites, collections
* Quote sharing and personalization
* Design process
* AI workflow and prompting strategy

---


## 🏁 Final Notes

QuoteVault prioritizes **quality, security, and clarity** over shortcuts. The project demonstrates how modern developers can effectively leverage AI tools while still maintaining strong engineering judgment.

---

**Built with ❤️, AI, and attention to detail.**

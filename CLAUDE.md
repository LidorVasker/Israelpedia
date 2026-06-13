@AGENTS.md
# IsraelPedia — Project Context

## What this is
IsraelPedia is an online encyclopedia focused on topics connected to Israel and
to Jewish history, culture, religion, language, science, notable people, and
communities worldwide. The goal is a genuinely high-quality, well-sourced,
trustworthy reference site — deep and comprehensive coverage of these subjects.

## Editorial principles (important)
- Articles must be accurate and well-sourced, with real citations.
- Encyclopedic, neutral tone. Coverage can be rich and celebratory where the
  subject genuinely warrants it, but conclusions are never fixed before the
  facts, and contested topics are represented accurately with sourcing.
- Credibility is the priority: it's what makes the site rank in search and get
  cited by other sources. Do not build features that fabricate sources or bias
  content regardless of facts.

## Who uses it (access model)
- Anyone (no account): can READ all published articles.
- Logged-in user (role: contributor): can additionally SUGGEST article topics.
- Admin (role: admin): can create, edit, delete/archive articles, and review
  the suggestion queue and AI-drafted articles.
- Only `/admin` routes require admin. Public reading requires nothing.
  Suggesting requires only being logged in (NOT admin).

## How it will eventually work (full system)
1. Users or an AI "discovery" agent propose topics → stored in `suggestions`.
2. An AI "triage" agent (and/or admins) decide accept/reject per topic.
3. An AI "drafting" agent researches accepted topics and writes a draft article
   WITH citations, saved as status="review", origin="ai".
4. Every AI draft goes through a HUMAN REVIEW QUEUE in the admin panel before
   being published. AI never publishes directly.
The AI pipeline will run as a SEPARATE worker service (not inside this Next.js
app), connected to the same database. Not built yet.

## Tech stack
- Next.js (App Router) + TypeScript
- Drizzle ORM → Neon Postgres (cloud)
- Auth.js v5 (NextAuth) with Google sign-in; Drizzle adapter
- Deployed on Vercel; database on Neon

## Key files
- `db/schema.ts` — all tables: users, articles, articleRevisions, suggestions,
  articleReferences, plus Auth.js tables (accounts, sessions, verificationTokens).
- `db/index.ts` — the `db` Drizzle client. Import this to query the database.
- `auth.ts` — exports `auth`, `signIn`, `signOut`, `handlers`. Use `auth()` to
  get the current session; `session.user.id` and `session.user.role` are available.
- `lib/auth-guard.ts` — `requireAdmin()` guards admin pages/actions.

## Article lifecycle
- status: draft → review → published → archived
- Deleting should ARCHIVE (set status="archived"), not hard-delete, so nothing
  is lost.
- Every edit writes a snapshot row to `articleRevisions` (full edit history).
- origin: "human" | "ai" | "user_suggestion"

## Conventions
- Server-side auth checks always (never trust the client).
- Re-check auth inside server actions, not just on the page.
- Keep secrets in env vars only. Never commit `.env`.
- Show file diffs and let me review/test before large changes are finalized.

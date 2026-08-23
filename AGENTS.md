# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Kairos is a flashcard web application with four learning modes: flashcards, learn (spaced repetition), test, and match. It is a single Next.js 16 app: pages live in `src/app`, and the API is implemented as Next.js route handlers under `src/app/api` (PostgreSQL via Drizzle ORM).

## Commands

```bash
npm run dev          # Dev server on port 3000 (pages + API routes)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest unit tests
docker compose up    # PostgreSQL + app
npm run db:migrate   # Apply Drizzle migrations (needs DATABASE_URL)
npm run db:generate  # Generate a migration from schema changes
npm run db:push      # Push schema directly to database (dev only)
npm run test:smoke   # E2E smoke test against a running server (needs DATABASE_URL)
```

## Design-Driven Development Workflow

The source of truth for all UI is the design file `layout.pen` (read via Pencil MCP tools, NOT with Read/Grep). Frontend pages must be implemented to match the design mockups.

### Workflow

1. **Before coding a page:** Read the corresponding mockup from `layout.pen` using `batch_get` and `get_screenshot` to understand the intended layout, spacing, colors, and components.
2. **If the design has issues:** Raise the concern to the user first. After confirmation, fix the design in `layout.pen` before writing any frontend code.
3. **After coding a page:** Visually verify the implementation against the design mockup using `get_screenshot`. Fix discrepancies.

### Design file structure (`layout.pen`)

**Design system components** (reusable): Button/Primary, Button/Secondary, Button/Ghost, Button/Destructive, IconButton, InputGroup, SearchBar, SidebarItem/Default, SidebarItem/Active, SidebarSectionTitle, Sidebar, NavBar, Card, Tab/Active, Tab/Inactive, TabBar, FlashCard, SetListItem, LanguageSelector, StudyModeCard, ProgressBar, WordRow, MoreDropdown, MobileMoreSheet.

**Page mockups** (each has Desktop 1440px + Mobile 390px variants):
- 00 - Login
- 01 - Dashboard
- 02 - Search Results
- 03 - Library
- 04 - Folders
- 05 - Set Detail
- 06 - Flashcard Mode
- 07 - Learn Mode
- 08 - Test Mode
- 09 - Match Mode
- 10 - Create Set
- 11 - Create Folder

## Architecture

Single Next.js app (App Router) + PostgreSQL via Drizzle ORM. Simple username-based auth with Bearer token sessions stored server-side (no passwords); SM-2 spaced repetition is computed exclusively on the server.

### Structure (`/src`)
- `app/` — Next.js App Router pages. Dynamic deck routes at `app/decks/[deckId]/` with sub-routes for each learning mode (flashcards, learn, test, match, edit).
- `app/api/` — Route handlers replacing the former Express backend (auth, decks, cards/review, folders, search). Server helpers live in `src/server/`:
  - `server/db/schema.ts` — Drizzle schema (users, sessions, folders, decks, cards; cards carry SR fields).
  - `server/lib/auth.ts` — Bearer token sessions with 30-day expiry (lazy cleanup of expired rows).
  - `server/lib/sr.ts` — SM-2 implementation (server-side source of truth).
  - `server/lib/queries.ts` — shared deck-summary select columns.
  - `server/types/api.ts` — single source of truth for API DTOs, inferred from the Drizzle schema. The frontend imports these type-only via `lib/types.ts`.
- `features/` — study-mode state machines: `flashcards/`, `learn/`, `test/`, `match/` hooks + pure engines (match-engine, grading).
- `components/` — Organized by domain: `ui/` (Button, Input, Modal), `layout/` (NavBar, Sidebar, AppShell), `deck/`, `flashcards/`, `learn/`, `test/`, `match/`.
- `contexts/AuthContext.tsx` — Auth state via React Context.
- `hooks/` — `useAuth`, `useDecks`, `useKeyboard`, `useTimer`.
- `lib/api.ts` — Centralized API client (same-origin `/api/*`). All requests go through this.
- `lib/test-generator.ts` — Generates multiple-choice, true/false, and written questions; grading lives in `features/test/grading.ts`.

### API
All endpoints under `/api` (same origin). Key routes: `/api/auth/login`, `/api/decks`, `/api/cards/:id/review` (POST, grades 0-5; SM-2 computed server-side), `/api/folders`, `/api/search?q=`.

## Environment Variables

Root `.env` (see `.env.example`): `DATABASE_URL` (required), optional `NEXT_PUBLIC_API_URL` to point the client at an external API instead of the built-in route handlers.

## Conventions

- All database IDs are UUIDs.
- All timestamps use milliseconds (`Date.now()`).
- Database deletes cascade from users to their data.
- Frontend uses `@` path alias for imports from `src/`.
- The `next.config.ts` uses standalone output mode for Docker deployment.

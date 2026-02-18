# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kairos is a flashcard web application with four learning modes: flashcards, learn (spaced repetition), test, and match. It uses a Next.js frontend with an Express/PostgreSQL backend.

## Commands

### Frontend (root directory)
```bash
npm run dev          # Dev server on port 3000
npm run build        # Production build
npm run lint         # ESLint
```

### Backend (`/backend`)
```bash
npm run dev          # Dev server with tsx watch on port 3001
npm run build        # Compile TypeScript
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema directly to database
```

### Docker (full stack)
```bash
docker-compose up    # PostgreSQL + backend + frontend
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

**Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + SWR for data fetching.

**Backend:** Express.js + PostgreSQL via Drizzle ORM. Simple username-based auth with Bearer token sessions (no passwords).

### Frontend structure (`/src`)
- `app/` — Next.js App Router pages. Dynamic deck routes at `app/decks/[deckId]/` with sub-routes for each learning mode (flashcards, learn, test, match, edit).
- `components/` — Organized by domain: `ui/` (Button, Input, Modal), `layout/` (NavBar, Sidebar, AppShell), `deck/`, `flashcards/`, `learn/`, `test/`, `match/`.
- `contexts/AuthContext.tsx` — Auth state via React Context.
- `hooks/` — `useAuth`, `useDecks`, `useKeyboard`, `useTimer`.
- `lib/api.ts` — Centralized API client. All requests go through this.
- `lib/sr.ts` — SM-2 spaced repetition algorithm implementation.
- `lib/test-generator.ts` — Generates multiple-choice, true/false, and written questions.
- `lib/types.ts` — Shared TypeScript interfaces.

### Backend structure (`/backend/src`)
- `index.ts` — Express app entry point with route registration.
- `db/schema.ts` — Drizzle ORM schema (users, sessions, folders, decks, cards). Cards include spaced repetition fields (srInterval, srEaseFactor, srRepetitions, srNextReview).
- `routes/` — auth, decks, cards, folders, search endpoints.
- `middleware/auth.ts` — Bearer token validation.

### API
All endpoints under `/api`. Key routes: `/api/auth/login`, `/api/decks`, `/api/cards/:id/sr`, `/api/folders`, `/api/search?q=`.

## Environment Variables

Frontend `.env`: `NEXT_PUBLIC_API_URL=http://localhost:3001`

Backend `backend/.env`: `DATABASE_URL`, `PORT` (3001), `CORS_ORIGIN` (http://localhost:3000)

## Conventions

- All database IDs are UUIDs.
- All timestamps use milliseconds (`Date.now()`).
- Database deletes cascade from users to their data.
- Frontend uses `@` path alias for imports from `src/`.
- The `next.config.ts` uses standalone output mode for Docker deployment.

# Kairos

掌握時機，掌握語言 — An open-source flashcard webapp for effective learning.

![Tech](https://img.shields.io/badge/Next.js%2016-React%2019-black) ![DB](https://img.shields.io/badge/Postgres-Drizzle%20ORM-blue)

## Features

- **Deck Management** — Create, edit, and delete flashcard decks with unlimited cards, organized into folders
- **Flashcards** — Flip through cards with smooth 3D animations and keyboard shortcuts (Space, arrows, S to shuffle)
- **Learn** — Multiple-choice questions scheduled by the SM-2 spaced repetition algorithm (computed server-side)
- **Test** — Configurable tests with multiple choice, true/false, and written questions, plus score review
- **Match** — Timed pairing game to reinforce term–definition associations
- **Accounts** — Lightweight username login with 30-day sessions; progress syncs across devices

## Getting Started

```bash
npm install
cp .env.example .env          # point DATABASE_URL at any Postgres
docker compose up -d db       # or use your own Postgres / Neon
npm run db:migrate            # create tables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), log in with any username (account is created automatically).

## Deploying to Vercel + Neon (free)

The app is a single Next.js project — pages and API routes deploy together.

1. Create a free Postgres at [neon.tech](https://neon.tech) and copy the **pooled connection string**.
2. Deploy to Vercel:
   ```bash
   npm i -g vercel
   vercel link
   vercel env add DATABASE_URL production   # paste the Neon pooled string
   vercel --prod
   ```
3. Run migrations against the cloud database once:
   ```bash
   export DATABASE_URL="postgresql://…pooler…"   # same string as above
   npx drizzle-kit migrate
   ```

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router + Turbopack) — UI **and** API routes in one app
- React 19 · TypeScript · Tailwind CSS 4 · SWR
- PostgreSQL via Drizzle ORM (serverless-friendly client: `max: 1`, `prepare: false`)
- SM-2 spaced repetition computed exclusively on the server (`POST /api/cards/:id/review`)

## Project Structure

```
src/
  app/            # Pages + API route handlers (app/api/**)
  server/         # Server-only code: db schema/client, auth, SR engine, API DTOs
  features/       # Study-mode state machines (flashcards/learn/test/match hooks)
  components/     # UI, layout, deck, and mode-specific components
  lib/            # API client, test generator, shared utils
drizzle/          # SQL migrations (drizzle-kit)
tests/            # Vitest unit tests + end-to-end smoke test
```

### API types are derived from the database schema

`src/server/types/api.ts` infers all request/response DTOs from the Drizzle
schema; the frontend consumes them via the type-only re-export in
`src/lib/types.ts`. Change the schema → types update everywhere.

## Testing

```bash
npm test              # unit tests (SM-2, question generator, match engine)
npm run build && npm start &
npm run test:smoke    # 12-check end-to-end test against a running server
```

## License

MIT

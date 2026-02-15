# Kairos

An open-source flashcard webapp for effective learning. Built with Next.js, Tailwind CSS, and localStorage.

## Features

- **Deck Management** — Create, edit, and delete flashcard decks with unlimited cards
- **Flashcards** — Flip through cards with smooth 3D animations and keyboard shortcuts (Space, arrows, S to shuffle)
- **Learn** — Multiple-choice questions powered by the SM-2 spaced repetition algorithm
- **Test** — Configurable tests with multiple choice, true/false, and written questions, plus score review
- **Match** — Timed pairing game to reinforce term-definition associations

All data is stored locally in your browser — no account required.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start learning.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router + Turbopack)
- [Tailwind CSS](https://tailwindcss.com)
- TypeScript
- localStorage for persistence
- SM-2 spaced repetition algorithm

## Project Structure

```
src/
  app/            # Next.js App Router pages
  components/     # UI, deck, flashcards, learn, test, match components
  hooks/          # useStore, useKeyboard, useTimer
  lib/            # types, storage, utils, SR algorithm, test generator
```

## License

MIT

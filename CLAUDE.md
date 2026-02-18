# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal trail journal app for a Continental Divide Trail hike (2024), combining journal entries, GPS messages, photos, and trail segment (leg) data into a unified interface with map visualization.

## Commands

```bash
pnpm dev        # Start dev server with Turbopack
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # Run ESLint
```

No test suite is configured.

## Architecture

**Framework**: Next.js 15 App Router with React Server Components and Server Actions.

**Auth**: NextAuth v5 (Credentials provider) with bcrypt. `middleware.ts` protects `/journal` routes and redirects authenticated users away from `/login`. Config split between `auth.ts` (main config) and `auth.config.ts` (callbacks/pages).

**Database**: PostgreSQL on Neon, accessed via the `postgres` npm package with raw SQL (no ORM). All queries live in `app/lib/data.ts`. All mutations are Server Actions in `app/lib/actions.ts` using Zod for validation.

**Key data model**:
- `dates` — each day on trail
- `entries` — journal text entries linked to a date
- `legs` — GPS trail segments linked to a date
- `photos` — images linked to a date
- `users` — authentication only

## App Structure

`app/journal/` is the main authenticated area with a sidebar layout (`layout.tsx`). Key routes:

- `listView/` — paginated, searchable list of entries
- `[entry_id]/` — single entry view; `[entry_id]/edit/` for editing
- `create/` — new entry form
- `map/` — D3.js trail map visualization
- `photoAlbum/` — photo grid (react-photo-album) with lightbox
- `calendarView/` — calendar-based browsing
- `assignLegs/` — utility to assign trail segments to specific dates

`app/lib/` contains all shared server-side logic: `data.ts` (queries), `actions.ts` (mutations), `definitions.ts` (TypeScript types), `utils.ts` (helpers).

`app/ui/` contains reusable components, organized into `components/` (generic) and `journal/` (feature-specific).

## Key Libraries

- **D3.js** — map visualization in `journal/map/`
- **react-photo-album** + **yet-another-react-lightbox** — photo gallery
- **DaisyUI** + **Tailwind CSS v4** — UI components and styling
- **date-fns** — date manipulation
- **Zod** — server action input validation
- **use-debounce** — search input debouncing

## Path Aliases

`@/*` maps to both the root and `./app/*` — both `@/lib/data` and `@/app/lib/data` resolve correctly.

## Custom Tailwind Colors

Trail-themed colors defined in `tailwind.config.js`: `oddDays`, `evenDays`, `campSites`, `messages`, `photos`.

## Environment Variables

Required in `.env`: `AUTH_SECRET`, `POSTGRES_URL`, `DATABASE_URL`, and Postgres connection vars (`PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).

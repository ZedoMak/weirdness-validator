## Weirdness Validator

An anonymous confession app for validating your weird habits. Users can post short confessions, vote “me too” or “nope”, and comment – all backed by a Neon (serverless PostgreSQL) database and deployed to Vercel.

### Stack

- **Frontend**: React + Vite, Tailwind CSS, Radix UI, `@tanstack/react-query`, Wouter
- **Backend**: Express, TypeScript, `drizzle-orm` on top of `pg`
- **Database**: Neon PostgreSQL
- **Build & Deploy**: Vite for client, esbuild for server (`script/build.ts`), Vercel (`vercel.json`)

---

## Features

- **Anonymous confessions**
  - Create short, validated confessions with a category (Thoughts, Food, Sleep, etc.).
  - Zod-based validation on both client and server.
- **Voting**
  - “Me too” vs “Nope” vote buttons.
  - Popular and controversial sorting based on vote counts / ratios.
- **Comments**
  - Comment on confessions with fun auto-generated anonymous names.
  - Like comments.
- **Filtering & search**
  - Filter by category, sort by **Newest / Popular / Controversial**.
  - Search confessions by text.
- **Stats**
  - Global stats for total confessions and total votes, shown in the hero and footer.
- **Nice UI details**
  - Brutalist card and button styling, marquee of example weirdness, responsive layout, custom scrollbars, and a global footer.

---

## Project structure

Key folders:

- `client/`
  - `src/App.tsx` – app shell and routing.
  - `src/pages/Home.tsx` – main homepage listing confessions.
  - `src/pages/not-found.tsx` – 404 page.
  - `src/components/` – UI components:
    - `ConfessionCard.tsx`, `CreateConfessionModal.tsx`, `CommentsDrawer.tsx`, `Marquee.tsx`, `Footer.tsx`, and `ui/*` (Radix-based primitives).
  - `src/hooks/use-confessions.ts` – React Query hooks for confessions, comments, and stats.
  - `src/lib/queryClient.ts` – shared React Query client.
- `server/`
  - `index.ts` – Express app setup, error logging, Vite dev middleware in development, static serving in production (non-Vercel).
  - `routes.ts` – API routes for confessions, comments, votes, and stats.
  - `db.ts` – Drizzle + `pg.Pool` connection using `DATABASE_URL`.
  - `storage.ts` – `IStorage` implementation using drizzle ORM (read/write to Neon).
  - `static.ts`, `vite.ts` – dev/production static serving helpers.
- `shared/`
  - `schema.ts` – drizzle table definitions + Zod insert schemas and TypeScript types.
  - `routes.ts` – shared API route metadata + helper `buildUrl`.
- Other:
  - `drizzle.config.js` – drizzle CLI configuration.
  - `vite.config.ts` – Vite config (client root, aliases).
  - `script/build.ts` – builds client with Vite and bundles server with esbuild into `dist/index.cjs`.
  - `vercel.json` – Vercel config mapping API routes to `server/index.ts` and static assets to `dist/public`.

---

## Getting started (local development)

### Prerequisites

- Node.js **>= 18** (recommended 18+ since Vercel / Neon expect a modern runtime)
- npm (comes with Node)
- A Neon PostgreSQL database (free tier is fine)

### 1. Clone and install

```bash
git clone <your-repo-url> weirdness-validator
cd weirdness-validator
npm install
```

### 2. Configure environment variables

Create a `.env` file at the project root:

```bash
cp .env.example .env  # if you create one, otherwise just make .env
```

Then set your Neon connection string:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

- You can copy this from the Neon dashboard (“Connection string”).
- The same `DATABASE_URL` should be configured in:
  - local `.env`
  - Vercel Project Settings → Environment Variables (Production) as `DATABASE_URL`

### 3. Run database migrations / push schema

This project uses drizzle ORM with `drizzle-kit`. To push the current schema to your Neon database:

```bash
npm run db:push
```

This will create the `confessions` and `comments` tables as defined in `shared/schema.ts`.

### 4. Start the dev server

```bash
npm run dev
```

- The Express server and Vite dev middleware run together on **http://localhost:5000**.
- API routes are under `/api/*`:
  - `GET /api/confessions`
  - `POST /api/confessions`
  - `POST /api/confessions/:id/vote`
  - `GET /api/confessions/:id/comments`
  - `POST /api/confessions/:id/comments`
  - `POST /api/comments/:id/like`
  - `GET /api/stats`

---

## Building & production

### Local production build

```bash
npm run build
```

This will:

- Build the client into `dist/public` using Vite.
- Bundle the server into `dist/index.cjs` using esbuild.

You can then start the bundled server locally:

```bash
npm run start
```

This runs `node dist/index.cjs`, serving both the API and static client from the same Express server.

### Vercel deployment

The repo includes `vercel.json` configured for:

- An **API function** built from `server/index.ts` using `@vercel/node`.
- A **static build** using `@vercel/static-build` that serves `dist/public` (built by `npm run build`).

To deploy:

1. Push the repo to GitHub/GitLab.
2. Import the project in Vercel.
3. Set the `DATABASE_URL` environment variable in Vercel (Production).
4. Use the default build command:

```bash
npm run build
```

Vercel will:

- Build the client into `dist/public`.
- Deploy the API using `server/index.ts`.

---

## Development notes

- **Edge vs Node**: The API is a classic Node/Express app (not an Edge function). Neon is accessed via `pg.Pool` with SSL enabled.
- **Shared types**: The `shared/` folder is imported by both client and server so routes and schemas stay in sync.
- **No seed data in production**: The old hard-coded seed confessions have been removed so real user data is the only data source. If you want demo data locally, add a one-off script or use a SQL client against Neon.

---

## Scripts

Common npm scripts:

- `npm run dev` – start the dev server (Express + Vite).
- `npm run build` – build client and bundle server into `dist/`.
- `npm run start` – run the bundled server (`dist/index.cjs`) in production mode.
- `npm run check` – TypeScript type checking.
- `npm run db:push` – push current drizzle schema to the database.

---

## License

MIT – feel free to fork, remix, and deploy your own flavor of weirdness. 


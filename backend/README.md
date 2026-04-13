<!-- markdownlint-disable MD040 -->
# Backend API

A TypeScript-based REST API server built with Express, Prisma ORM, and SQLite. Provides data persistence and API endpoints for user management, projects (summaries, quizzes, decks), and social features.

## Architecture Overview

### Core Components

- **Express Server**: REST API server with organized route handlers
- **Middleware Stack**: Error handling, 404 responses, JSON parsing
- **Prisma ORM**: Type-safe database access layer with SQLite
- **SQLite Database**: Local file-based database (`dev.db`)

### Data Model

- **User**: Authentication and profile data (email, username, hashed password)
- **Project**: Container for learning content (type: Summary/Quiz/Deck), associated with users
- **Summary/Quiz/Deck**: Typed project content (relationships via Project)
- **Follow**: Social graph for user following
- **Tags**: Project categorization

### Key Files

```
src/
  app.ts              # Express app factory
  index.ts            # Server entrypoint
  context.ts          # Dependency injection context
  lib/                # Business logic (user, deck, quiz, etc.)
  routes/             # Express route handlers by resource
  middleware/         # Error handling, 404
  utils/              # Shared utilities (API errors, async handlers)
prisma/
  schema.prisma       # Data model definitions
  migrations/         # Database migration history
generated/prisma/    # Auto-generated Prisma client (read-only)
```

## Setup

### 1. Install Dependencies

From the `backend/` directory:

```bash
npm i
```

This installs all dependencies and prepares the Prisma client.

### 2. Validate & Generate

Generate the Prisma client:

```bash
npm run prisma:generate
```

### 3. Initialize Database (if first time)

Prisma migrations are applied automatically on first run. Verify the database is up to date:

```bash
npx prisma migrate status
```

If migrations are pending:

```bash
npx prisma migrate deploy
```

## Running the Backend

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode (single run)

```bash
npm run start
```

Starts the server at `http://localhost:3000` with file watching via `tsx`.

## Testing

### Run All Tests

```bash
npm test
```

Runs all test suites in the `tests/` directory once.

### Test Organization

```
tests/
  unit/
    lib/                    # Business logic unit tests
  integration/
    routes.test.ts          # Route handler integration tests
```

## API Endpoints

The API is mounted at `/api` with organized route modules:

- `/api/users/` — User management
- `/api/projects/` — Project CRUD
- `/api/decks/` — Deck-specific operations
- `/api/quizzes/` — Quiz-specific operations
- `/api/summaries/` — Summary-specific operations
- `/api/follows/` — Follow relationships
- `/api/tags/` — Project tags
- `/api/health` — Health check (no `/api` prefix)

Example health check:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

## Important Notes

- **Database Location**: `backend/dev.db`
- **Environment**: `backend/.env`
- **Generated Code**: Files in `backend/generated/prisma/` are auto-generated; do not edit manually
- **Migrations**: All schema changes must go through Prisma migrations; do not manually edit the database
- **No Build Output**: This is a dev/source server; use `npm run build` to generate TypeScript output to `dist/`

Recommended to use:

- Node.js v24.14.0 or later
- npm 10.8.3 or later

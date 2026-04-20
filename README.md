# final-apps Monorepo Setup Guide

This repository contains two independent Node-based projects:

1. `backend` - Express + Prisma + SQLite API.
2. `recapify` - Expo Router React Native app (web/mobile).

There is no root `package.json`, so do not run `npm` commands from the repo root.

## 1. Required Tool Versions

Use these versions (or newer compatible patch versions):

- Node.js: `v24.14.0`
- npm: `10.8.3`
- Expo CLI: `54.x` (run with `npx expo`, do not require global install)
- Prisma CLI: installed from `backend` devDependencies via `npm ci`

Quick version check:

```powershell
node -v
npm -v
Set-Location recapify
npx expo --version
```

## 2. Files You Must Create

### `backend/.env` (required)

Create `backend/.env` if it does not exist.

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT="3000"
# Optional: lock down allowed frontend origins (comma-separated)
# CORS_ORIGIN="http://localhost:8081,http://127.0.0.1:8081"
```

Value notes:

- `DATABASE_URL`: local SQLite database path.
- `JWT_SECRET`: required for auth token generation/verification.
- `JWT_EXPIRES_IN`: optional, defaults to `7d` if omitted.
- `PORT`: optional, backend defaults to `3000` if omitted.
- `CORS_ORIGIN`: optional for stricter CORS in non-default setups.

### `recapify/.env` (optional but recommended)

Create `recapify/.env` when you want to force a specific backend URL, especially on physical devices.

```env
EXPO_PUBLIC_API_BASE_URL="http://YOUR_LAN_IP:3000/api"
EXPO_PUBLIC_API_PORT="3000"
EXPO_PUBLIC_API_TIMEOUT_MS="12000"
```

Value notes:

- `EXPO_PUBLIC_API_BASE_URL`: full backend API base URL. Most important override.
- `EXPO_PUBLIC_API_PORT`: used only when base URL is not set.
- `EXPO_PUBLIC_API_TIMEOUT_MS`: request timeout in milliseconds.

If you do not set these, the app uses runtime fallbacks for host detection.

## 3. Dependencies to Install

Install dependencies separately in each project:

1. `backend`: installs Express, Prisma, TypeScript, Jest, and related packages.
2. `recapify`: installs Expo SDK 54, React Native 0.81, Expo Router, and UI/runtime packages.

Use `npm ci` for consistent installs from lockfiles.

## 4. Step-by-Step Setup Commands

Run from repo root:

### Step 1: Install backend dependencies

```powershell
Set-Location backend
npm ci
```

### Step 2: Validate Prisma schema and generate client

```powershell
npm run prisma:validate
npm run prisma:generate
```

### Step 3: Verify migration state

```powershell
npx prisma migrate status
```

If migrations are pending:

```powershell
npx prisma migrate deploy
```

### Step 4: Start backend API

```powershell
npm run start
```

Backend runs at `http://localhost:3000` by default.

### Step 5: Install recapify dependencies (new terminal)

```powershell
Set-Location ..\recapify
npm ci
```

### Step 6: Start Expo app

For Expo dev server (device/emulator options):

```powershell
npm run start
```

## 5. Recommended Validation Commands

### Backend validation

```powershell
Set-Location backend
npm run typecheck
npm test
```

### Recapify validation

```powershell
Set-Location ..\recapify
npm run lint
```

## 6. Common Setup Rules

- Do not run `npm` from repo root (no root package manifest).
- Keep backend and frontend terminals separate while developing.
- `backend/generated/prisma` is generated code; do not edit manually.
- `backend/uploads/avatars` is created automatically when avatar uploads are used.
- If mobile clients cannot reach backend, set `EXPO_PUBLIC_API_BASE_URL` to your machine LAN IP.

## 7. First-Run Checklist

1. Confirm Node/npm/Expo versions.
2. Create `backend/.env` with valid values.
3. Run backend install + Prisma generate.
4. Start backend (`npm run start`).
5. Optionally create `recapify/.env` API overrides.
6. Run recapify install and start (`npm run web` or `npm run start`).

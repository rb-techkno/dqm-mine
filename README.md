# DataGuard

DataGuard is a full-stack starter project with a React + Tailwind frontend and an Express backend.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database support: PostgreSQL (primary), MySQL, MongoDB

## Project Structure

```text
DataGuard/
  client/   # React app
  server/   # Express API
```

## Quick Start

1. Install dependencies (from repo root):

```bash
npm install
npm install --prefix client
npm install --prefix server
```

2. Copy `server/.env.example` to `server/.env` and set your DB values.
3. Start frontend + backend together:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - run both frontend and backend
- `npm run client` - run only frontend
- `npm run server` - run only backend
- `npm run build` - build frontend

## API Endpoints

- `GET /api` - base API route
- `GET /api/health` - API health
- `GET /api/db/status` - selected database connection test

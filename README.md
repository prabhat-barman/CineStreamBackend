# CineStream Backend

REST API for the CineStream mobile app and admin panel. Built with **Node.js + Express + TypeScript**.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs at `http://localhost:4000`.

## Default credentials

- **Admin**: `admin@cinestream.app` / `admin123`
- **Demo user**: `demo@cinestream.app` / `demo123`

Change these in `.env` before deploying.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | TypeScript typecheck without emit |

## API overview

### Auth

- `POST /auth/register` — `{ name, email, password }` → `{ token, user }`
- `POST /auth/login` — `{ email, password }` → `{ token, user }`
- `GET /auth/me` — requires `Authorization: Bearer <token>`

### Movies

- `GET /movies?q=&genre=&featured=`
- `GET /movies/:id`
- `POST /movies` (admin)
- `PATCH /movies/:id` (admin)
- `DELETE /movies/:id` (admin)

### Admin

All admin routes require an **admin** JWT.

- `GET /admin/stats` — dashboard counts + top rated
- `GET /admin/users`
- `DELETE /admin/users/:id`

## Data

Uses an **in-memory store** seeded with 12 movies + admin + demo user. Data resets on restart. Swap `src/data/store.ts` for a real DB when needed (SQLite / Postgres / Mongo).

## Environment

See `.env.example`:

```
PORT=4000
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@cinestream.app
ADMIN_PASSWORD=admin123
CORS_ORIGIN=*
```

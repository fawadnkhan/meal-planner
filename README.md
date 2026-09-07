# 🥗 Meal Planner

A full-stack web app for planning weekly meals, managing recipes, and generating shopping lists.

**Live app:** `https://meal-planner-nu-five.vercel.app/` *(replace after deployment)*
**API:** `https://meal-planner-api-82e5.onrender.com` *(replace after deployment)*

---

## Features

| Feature | Details |
|---|---|
| Auth | JWT-based registration & login |
| Recipes | Create, edit, delete with ingredients; export/import as JSON |
| Meal Plans | Weekly calendar view with drag-and-drop assignment |
| Shopping List | Auto-aggregated from a meal plan, with checkbox progress tracking |
| Responsive | Mobile-first Tailwind UI |
| Accessible | ARIA labels, keyboard navigation, focus management |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS, @dnd-kit, Zustand, TanStack Query |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Testing | Jest + Supertest |
| Frontend hosting | Vercel |
| Backend hosting | Render (or Railway / Heroku) |
| DB hosting | Render Managed Postgres (or Supabase) |

---

## Project Structure

```
Planner/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # DB schema
│   ├── src/
│   │   ├── controllers/         # Business logic
│   │   ├── middleware/          # auth.ts, validate.ts
│   │   ├── routes/              # Express routers
│   │   ├── lib/
│   │   │   └── prisma.ts        # Prisma client singleton
│   │   └── index.ts             # App entry point
│   ├── tests/                   # Jest + Supertest test suites
│   ├── Dockerfile
│   ├── render.yaml              # Render deployment config
│   ├── Procfile                 # Heroku/Railway config
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/                 # Next.js App Router pages
    │   │   ├── login/
    │   │   ├── register/
    │   │   ├── dashboard/
    │   │   ├── recipes/
    │   │   ├── meal-plans/
    │   │   └── shopping-list/
    │   ├── components/          # Reusable UI components
    │   ├── lib/                 # API client, auth helpers, Zustand store
    │   └── types/               # Shared TypeScript types
    ├── vercel.json
    └── .env.local.example
```

---

## Database Schema

```
users               – id, email, name, password_hash
recipes             – id, title, description, instructions, servings, prep_time, cook_time, image_url, user_id
ingredients         – id, name (unique, lowercase)
recipe_ingredients  – id, recipe_id, ingredient_id, quantity, unit, notes
meal_plans          – id, name, week_start, user_id
meal_plan_items     – id, meal_plan_id, recipe_id, day_of_week (0=Mon…6=Sun), meal_type, servings
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Get current user 🔒 |

### Recipes
| Method | Path | Description |
|---|---|---|
| GET | `/api/recipes` | List own recipes 🔒 |
| POST | `/api/recipes` | Create recipe 🔒 |
| GET | `/api/recipes/:id` | Get recipe detail 🔒 |
| PUT | `/api/recipes/:id` | Update recipe 🔒 |
| DELETE | `/api/recipes/:id` | Delete recipe 🔒 |
| GET | `/api/recipes/:id/export` | Export as JSON 🔒 |
| POST | `/api/recipes/import` | Import from JSON 🔒 |

### Ingredients
| Method | Path | Description |
|---|---|---|
| GET | `/api/ingredients?search=` | Search ingredients 🔒 |

### Meal Plans
| Method | Path | Description |
|---|---|---|
| GET | `/api/meal-plans` | List meal plans 🔒 |
| POST | `/api/meal-plans` | Create meal plan 🔒 |
| GET | `/api/meal-plans/:id` | Get plan + items 🔒 |
| PUT | `/api/meal-plans/:id` | Update plan 🔒 |
| DELETE | `/api/meal-plans/:id` | Delete plan 🔒 |
| POST | `/api/meal-plans/:id/items` | Add recipe to day 🔒 |
| PUT | `/api/meal-plans/:id/items/:itemId` | Move/update item 🔒 |
| DELETE | `/api/meal-plans/:id/items/:itemId` | Remove item 🔒 |

### Shopping List
| Method | Path | Description |
|---|---|---|
| GET | `/api/shopping-list/:id` | Get aggregated list 🔒 |

🔒 = requires `Authorization: Bearer <token>`

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 9+
- PostgreSQL 15+ running locally **or** a Supabase/Render connection string

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/meal-planner.git
cd meal-planner

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure environment variables

**Backend** — copy and fill in:
```bash
cp backend/.env.example backend/.env
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/meal_planner"
JWT_SECRET="change-me-to-a-long-random-string"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

**Frontend** — copy and fill in:
```bash
cp frontend/.env.local.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Set up the database

```bash
cd backend

# Create the database (if local Postgres)
createdb meal_planner

# Push the schema and generate Prisma client
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run the dev servers

Open two terminals:

```bash
# Terminal 1 – backend (http://localhost:4000)
cd backend && npm run dev

# Terminal 2 – frontend (http://localhost:3000)
cd frontend && npm run dev
```

Visit `http://localhost:3000` and register an account.

---

## Running Tests

Tests require a separate test database to avoid wiping your dev data.

```bash
# Create the test database
createdb meal_planner_test

# Copy and configure the test env file
cp backend/.env.test.example backend/.env.test
# Edit backend/.env.test — set DATABASE_URL to your test DB

# Push the schema to the test DB
cd backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Run tests
npm test

# With coverage
npm run test:coverage
```

The test suite covers:
- **Auth** – register, login, /me, error cases (9 tests)
- **Recipes** – CRUD, export, import, authorization (14 tests)
- **Meal Plans** – plan CRUD, item add/update/remove, shopping list aggregation (14 tests)

---

## Deployment

## Mobile client

The Expo React Native client is in `mobile/`. It uses the existing REST API, SecureStore for JWTs, AsyncStorage for cached reads, and includes an offline write-queue helper for plan mutations.

```bash
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to override the production API. Before store builds, add branded `icon.png` and `splash.png` assets, configure EAS credentials, and complete native notification, privacy, terms, screenshot, and store metadata work. The current backend does not yet expose profile-preference or push-notification endpoints.

### Backend → Render (recommended free tier)

1. Push to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect repo.
3. Set **Root Directory** to `backend`.
4. Set **Build Command**: `npm ci && npx prisma generate && npm run build`
5. Set **Start Command**: `npx prisma migrate deploy && node dist/index.js`
6. Add environment variables (see table below).
7. Create a **Render Postgres** database and copy the connection string into `DATABASE_URL`.

Alternatively, use the included `render.yaml` for **Blueprint** (auto-creates service + DB):
```bash
# From repo root, connect to Render → New → Blueprint
```

### Backend → Railway

1. Connect repo at [railway.app](https://railway.app).
2. Add a Postgres plugin.
3. Set the environment variables listed below.
4. Railway auto-detects Node.js; set the start command to `npx prisma migrate deploy && node dist/index.js`.

### Frontend → Vercel

1. Import the repo at [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add the environment variable:

```
NEXT_PUBLIC_API_URL = https://YOUR_BACKEND_URL/api
```

4. Deploy. Vercel auto-builds Next.js.

---

## Environment Variables

### Backend

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs (min 32 chars in production) |
| `JWT_EXPIRES_IN` | ✅ | Token lifetime, e.g. `7d` |
| `PORT` | — | Server port (default: `4000`) |
| `NODE_ENV` | — | `development` / `production` / `test` |
| `FRONTEND_URL` | ✅ | CORS origin, e.g. `https://your-app.vercel.app` |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Full API base URL, e.g. `https://your-api.render.com/api` |

---

## Extras Implemented

- **Drag-and-drop** meal assignment via `@dnd-kit` — drag any recipe card between day/meal slots
- **Recipe export/import** — download a recipe as JSON, re-import on any account
- **Recipe search** — filter recipes by name on the list page and inside the calendar picker
- **Progress tracking** — shopping list has a live progress bar as you tick off items
- **Print-friendly** shopping list

---

## Timeline

| Phase | Target |
|---|---|
| Prototype (all features working locally) | Day 3–5 |
| Tests + deployment config | Day 6–7 |
| Live deployed app | Day 8–10 |

---

## Contributing

1. Fork the repo.
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feat/my-feature`
5. Open a pull request.

---

## License

MIT

# Deployment Guide: Honeyent ERP (Railway & Netlify)

This guide covers deployment instructions for **Railway** (Backend & Frontend) and **Netlify** (Frontend).

---

## Architecture Overview

- **Backend**: Node.js + Express 5 + TypeScript + PostgreSQL (`backend/`)
- **Frontend**: TanStack Start React SSR + Vite + Nitro + TailwindCSS (`frontend/`)

---

## 1. Railway Deployment

Railway supports deploying the project in either of two ways:
- **Option A (Separate Services - Recommended for Production)**: Backend and Frontend run as distinct Railway services with independent scaling.
- **Option B (Single Combined Service)**: Backend and Frontend run inside one Railway container orchestrated by `start.js`.

---

### Option A: Two Separate Railway Services (Recommended)

#### Step 1: Deploy the Backend Service
1. In your [Railway Dashboard](https://railway.app), open your project and click **New** -> **GitHub Repo**.
2. Select `sumit3singh/honeyent`.
3. Go to the new service **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. In **Variables**, add:
   - `PORT`: `3000` (Railway will assign one or route to it automatically)
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your PostgreSQL connection string (from Neon or Railway Postgres plugin, e.g. `postgresql://...`)
   - `JWT_SECRET`: A secure random string
   - `JWT_EXPIRE`: `7d`
   - `FRONTEND_URL`: Your Railway frontend URL or Netlify URL (e.g. `https://honeyent-frontend.up.railway.app,https://honeyent.netlify.app`)
5. In **Networking**, click **Generate Domain** to get a public URL (e.g. `https://honeyent-backend.up.railway.app`).
6. *(Optional)* Run database migrations: Open the Railway backend service terminal or run locally:
   ```bash
   cd backend
   npm run migrate
   ```

#### Step 2: Deploy the Frontend Service
1. In the same Railway project, click **New** -> **GitHub Repo** -> select `sumit3singh/honeyent`.
2. Go to the service **Settings**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. In **Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: (Railway provides this automatically)
   - `BACKEND_URL`: Your backend Railway URL, e.g. `https://honeyent-backend.up.railway.app`
   - `VITE_API_URL`: `https://honeyent-backend.up.railway.app/api`
4. In **Networking**, click **Generate Domain** to get your frontend public URL.

---

### Option B: Single Combined Railway Service

Deploy both backend and frontend together within a single container:
1. In Railway, click **New** -> **GitHub Repo** -> select `sumit3singh/honeyent`.
2. Leave **Root Directory** empty (defaults to repo root).
3. Railway will automatically pick up `railway.toml` and `Procfile` (`web: node start.js`).
4. In **Variables**, configure:
   - `PORT`: (Railway provides this)
   - `BACKEND_PORT`: `3000` (internal backend port)
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random secret
5. In **Networking**, click **Generate Domain**.
6. The root runner `start.js` will start the backend on port 3000, verify `/health`, and start the frontend SSR server to proxy `/api` requests seamlessly.

---

## 2. Netlify Deployment (Frontend)

You can host the Frontend on Netlify while keeping the Backend on Railway.

### Steps:
1. Log in to [Netlify](https://app.netlify.com/) and click **Add new site** -> **Import an existing project**.
2. Connect your GitHub repository `sumit3singh/honeyent`.
3. Configure build settings (or let `netlify.toml` detect them):
   - **Base directory**: `frontend` (or root using root `netlify.toml`)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/client`
4. Under **Environment variables**, add:
   - `NETLIFY`: `true` (enables Nitro's native Netlify serverless adapter)
   - `NODE_VERSION`: `20`
   - `VITE_API_URL`: Your backend API URL (e.g. `https://honeyent-backend.up.railway.app/api`)
5. Click **Deploy site**.
6. Once deployed, copy your Netlify site URL (e.g. `https://honeyent.netlify.app`) and add it to `FRONTEND_URL` in your Railway Backend service variables to allow CORS.

---

## 3. Environment Variables Reference

### Backend (`backend/.env` or Railway Variables)
| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://neondb_owner:***@host:5432/neondb` |
| `PORT` | Listening port (Railway sets this) | `3000` |
| `NODE_ENV` | Environment mode | `production` |
| `FRONTEND_URL` | Allowed CORS origins (comma-separated) | `https://honeyent.netlify.app,https://frontend.up.railway.app` |
| `JWT_SECRET` | Secret key for JWT signing | `your_strong_secret` |
| `JWT_EXPIRE` | Expiry duration for auth tokens | `7d` |

### Frontend (`frontend/.env` or Railway/Netlify Variables)
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Full URL to backend API endpoint | `https://honeyent-backend.up.railway.app/api` |
| `BACKEND_URL` | Base backend URL (used by server runner) | `https://honeyent-backend.up.railway.app` |
| `PORT` | Server listening port (auto-set by Railway) | `8080` |
| `NETLIFY` | Set to `true` when building on Netlify | `true` |

---

## 4. Local Development

Install dependencies from repository root:
```bash
npm run install:all
```

Start backend (port 3000):
```bash
npm run dev:backend
```

Start frontend (port 8080 / 5173):
```bash
npm run dev:frontend
```

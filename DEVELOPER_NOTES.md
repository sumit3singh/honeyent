# Honeyent Developer Notes

## 1. Project Overview

This repository is a monorepo for the Honeyent project. It contains:

- `backend/` — Node.js + Express backend written in TypeScript
- `frontend/` — Vite-powered React SSR frontend using TanStack Start
- `start.js` — root startup wrapper for a single Railway deployment
- `Procfile` — Railway `web` command entrypoint

The project is designed to run both backend and frontend together in one service, but it can also be split into separate backend and frontend services.

---

## 2. Repository Structure

```
/honeyent
  /backend
    package.json
    tsconfig.json
    src/
      index.ts
      routes/
      config/
  /frontend
    package.json
    tsconfig.json
    vite.config.ts
    server.js
    dist/
      client/
      server/
  start.js
  Procfile
  package.json
  DEPLOYMENT.md
```

### What each top-level file does

- `package.json` — root scripts for install, build, start
- `start.js` — starts backend first, waits for `/health`, then starts frontend
- `Procfile` — Railway service entry: `web: node start.js`
- `DEPLOYMENT.md` — high-level deployment notes and recommended approach

---

## 3. Key Technologies

- Backend
  - Node.js 22
  - Express 5
  - TypeScript
  - PostgreSQL via `pg`
  - `dotenv`
  - `bcryptjs`, `jsonwebtoken`, `zod`

- Frontend
  - React 19
  - Vite 8
  - `@tanstack/react-start`
  - SSR support via built `frontend/dist/server/server.js`
  - Static assets served from `frontend/dist/client`

- Deployment
  - Railway Railpack builder
  - `Procfile` for custom entry
  - Root `start.js` wrapper for combined backend/frontend service

---

## 4. How the Build Works

### Backend build

The backend is built with TypeScript.

- `backend/package.json` has:
  - `build`: `tsc`
  - `start`: `node dist/index.js`

When you run `npm run backend:build`, TypeScript compiles `src/` into `backend/dist/`.

### Frontend build

The frontend uses Vite.

- `frontend/package.json` has:
  - `build`: `vite build`
  - `start`: `node server.js`

The build output is:

- `frontend/dist/client/` — static assets
- `frontend/dist/server/server.js` — SSR server bundle

### Combined build from root

The root `package.json` defines:

- `backend:build`: build backend
- `frontend:build`: build frontend
- `build`: run both builds in sequence

This is the command used by Railway during deploy:

```bash
npm run build
```

---

## 5. How to Run Locally

### 5.1 Install dependencies

From the repo root:

```bash
npm run install
```

This runs:

- `cd backend && npm install`
- `cd frontend && npm install`

### 5.2 Build the project

```bash
npm run backend:build
npm run frontend:build
```

Or run the combined build:

```bash
npm run build
```

### 5.3 Start backend and frontend separately

Open two terminals.

Terminal 1:

```bash
npm run backend:start
```

Terminal 2:

```bash
npm run frontend:start
```

`backend:start` runs `cd backend && npm start`.

`frontend:start` runs `cd frontend && npm start`.

### 5.4 Local dev mode

For faster local development, use the packages directly.

- Backend dev mode:

```bash
cd backend
npm run dev
```

- Frontend dev mode:

```bash
cd frontend
npm run dev
```

### 5.5 Environment notes

- Frontend expects the backend API at `/api` by default.
- For production or separate service deployment, set environment variables like `VITE_API_URL`.
- `BACKEND_PORT` is used by the server runner to proxy backend traffic.

---

## 6. Deployment Flow

### 6.1 Railway build and start

Railway reads `Procfile` and the root `package.json`.

- Build: `npm run build`
- Start: `node start.js`

### 6.2 `Procfile`

The app uses this command:

```text
web: node start.js
```

This tells Railway to run `node start.js` when the container starts.

### 6.3 `start.js`

`start.js` is the deployment wrapper located at repository root. It does:

1. Start backend in `backend/`
2. Wait until TCP port `3000` is open
3. Wait until `http://127.0.0.1:3000/health` returns OK
4. Start frontend in `frontend/`

This ensures the backend is ready before the frontend accepts requests.

### 6.4 Frontend runner

`frontend/server.js` is the SSR entrypoint for the built frontend. It:

- Loads `frontend/dist/server/server.js`
- Serves static files from `frontend/dist/client`
- Proxies `/api/*` to the backend
- Proxies `/health` to the backend
- Starts HTTP server on `PORT`

This is essential when using one Railway service for both frontend and backend.

---

## 7. Important Files and Their Roles

### `backend/package.json`

Important scripts:

- `build`: compile TypeScript with `tsc`
- `start`: run the compiled backend
- `dev`: run backend in watch mode with `tsx`

### `frontend/package.json`

Important scripts:

- `build`: run `vite build`
- `start`: run `node server.js`
- `dev`: run Vite dev server

### `frontend/vite.config.ts`

The dev config may include a proxy for `/api` so the frontend can access the backend during local development without CORS issues.

### `frontend/server.js`

The production SSR runner:

- handles static asset requests for `/assets/*`
- proxies `/api` requests to backend
- proxies `/health` requests to backend
- loads SSR handler from build output

### `start.js`

The deployment wrapper for Railway:

- starts backend first
- waits for backend readiness
- then starts frontend

### `Procfile`

Defines the Railway web entrypoint.

### `DEPLOYMENT.md`

Contains project deployment notes and helpful recommendations.

---

## 8. Issues We Faced and Why They Happened

This project had several important issues during deployment and local testing.

### 8.1 Issue: Deployment started only frontend or wrong entrypoint

**Symptom:** deployment logs showed the frontend server started, but backend was not available or failing.

**Cause:** Railway was using the wrong start command or the deployment did not start the backend before the frontend.

**Fix:** Use `Procfile` with `web: node start.js` and keep `start.js` as the wrapper that starts backend first.

### 8.2 Issue: `/health` returned `502` or `404`

**Symptom:** Railway health endpoint failed even though the service started.

**Cause:** frontend runner was not proxying `/health` to the backend, or backend was not fully ready.

**Fix:** Add the `/health` proxy route in `frontend/server.js` and wait for backend health in `start.js`.

### 8.3 Issue: Static assets under `/assets/*` returned errors

**Symptom:** assets such as JS/CSS failed to load with 500 or 404.

**Cause:** static file path resolution was incorrect in the runner.

**Fix:** add explicit static-file mapping for `/assets/` in `frontend/server.js` and serve from `frontend/dist/client/assets`.

### 8.4 Issue: stale localhost API URLs in built frontend

**Symptom:** built app tried to call `http://localhost:3000/api` or wrong backend URL in production.

**Cause:** frontend build had hardcoded or default dev API URL values.

**Fix:** normalize API host/port in client code and set real `VITE_API_URL` for production if using separate backend.

### 8.5 Issue: Local dev `/api/auth/login` returned 404

**Symptom:** frontend dev app failed to reach backend login endpoint.

**Cause:** missing Vite proxy or backend dev server mismatch.

**Fix:** configure frontend dev proxy in `vite.config.ts` so `/api` requests are forwarded to backend port.

### 8.6 Issue: Deployment URL NXDOMAIN locally

**Symptom:** browser could not resolve the Railway hostname, even though the service existed.

**Cause:** local DNS cache, local resolver misconfiguration, or selective DNS blocking.

**Fix:** verify with public DNS servers like `8.8.8.8`, flush local DNS cache, or use `curl --resolve` for testing.

---

## 9. What We Did to Fix the Issues

### 9.1 Added a startup wrapper in `start.js`

The wrapper now does:

- start backend first
- wait for TCP port open
- wait for `/health`
- start frontend after backend readiness

This avoids race conditions where the frontend begins before the backend is ready.

### 9.2 Added backend fallback logic in `frontend/server.js`

The runner now:

- starts backend if not already listening on `BACKEND_PORT`
- waits for backend port and HTTP readiness
- serves static files and proxies backend requests

This is very useful for a single-container deployment.

### 9.3 Added router for `/health` proxy

The frontend server now forwards `/health` to backend, so health checks work for the public service.

### 9.4 Added static `/assets/` resolution

The static server resolves `/assets/*` to the client build folder and serves assets with the correct MIME type.

### 9.5 Used debug commands to inspect deployment

Important debugging commands included:

- `curl -I https://<deploy-url>/`
- `curl --resolve <host>:443:<ip> -Ik https://<host>/`
- `nslookup <host> 8.8.8.8`
- `ipconfig /flushdns`
- `node --check frontend/server.js`
- `node --check start.js`

These helped confirm if the app was healthy and if DNS was the failure point.

---

## 10. Full Command List and What They Do

### Install commands

```bash
npm run install
```

- runs dependency install in both `backend` and `frontend`
- ensures the monorepo dependencies are installed

### Build commands

```bash
npm run backend:build
npm run frontend:build
npm run build
```

- `backend:build` runs TypeScript compilation
- `frontend:build` runs Vite build
- `build` runs both

### Start commands

```bash
npm run backend:start
npm run frontend:start
npm start
```

- `backend:start` starts only backend
- `frontend:start` starts only frontend SSR runner
- `npm start` at repo root runs `node start.js` and starts both backend and frontend sequentially

### Dev commands

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

- backend dev watches TypeScript via `tsx`
- frontend dev starts Vite dev server

### Debug commands

```bash
node --check frontend/server.js
node --check start.js
curl -I https://<url>/
curl --resolve <host>:443:<ip> -Ik https://<host>/
nslookup <host> 8.8.8.8
ipconfig /flushdns
```

These confirm syntax, deployment health, and DNS resolution.

---

## 11. Deployment Checklist

Before deploying, verify:

1. `npm run build` passes without errors
2. `backend/dist/index.js` exists
3. `frontend/dist/server/server.js` exists
4. `frontend/dist/client` exists and contains `/assets/`
5. `Procfile` is set to `web: node start.js`
6. Railway environment variables are correct
7. If using separate backend service, `VITE_API_URL` points to backend API
8. `/health` works locally and on deployment

---

## 12. Common Gotchas and Tips

- Always check the actual Railway hostname: it can change when you delete and recreate a deploy.
- If the browser shows `DNS_PROBE_FINISHED_NXDOMAIN`, check DNS directly; the service may still be alive.
- `curl --resolve` is the fastest way to test a deployment when DNS has not propagated.
- Use `npm run install` from the repo root so both packages are installed in one step.
- Keep frontend build and backend build separate to isolate issues.
- When using a combined deploy, let `start.js` orchestrate startup to avoid timing bugs.

---

## 13. Q&A Style Summary

### Q: Why do we need `start.js`?
A: Because the project runs backend and frontend together in one container. `start.js` starts the backend, waits for it to be healthy, then starts the frontend.

### Q: Why is `/health` important?
A: Railway and other platforms use health checks to know whether the service is ready. A `/health` endpoint lets us verify backend readiness before accepting traffic.

### Q: Why does frontend proxy `/api`?
A: The frontend SSR server needs to send API requests to the backend without exposing a separate port. Proxying `/api` keeps the public interface consistent.

### Q: Why did assets fail?
A: Because the static server must resolve `/assets/*` from `frontend/dist/client/assets`. If the static path is wrong, asset requests will 404 or 500.

### Q: Why did the browser fail on the Railway URL?
A: In your case, local DNS resolution was failing even though the service was live. The fix is to verify with public DNS and flush the local DNS cache.

---

## 14. Final Notes for the Next Project

If you build the next project, keep these principles in mind:

- Separate build and runtime clearly.
- Know exactly which command the platform runs.
- Use a wrapper entrypoint when multiple processes must start together.
- Add health checks and readiness probes for backend services.
- Keep static asset paths explicit.
- Use debug tools like `curl`, `nslookup`, and `node --check`.
- Document your workflow in a single `DEVELOPER_NOTES.md`.

This file is your reference book for the Honeyent monorepo. Use it to learn the flow, reproduce the setup, and avoid the same deployment pitfalls next time.

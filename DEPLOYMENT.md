Deployment and local run instructions

1. Overview

- Frontend (Vite SSR) is in `frontend/`.
- Backend (Node + Express, TypeScript) is in `backend/`.

2. Recommended deployment

- Deploy backend and frontend as separate Railway services.
- Set `VITE_API_URL` in the frontend service build environment to point to the backend's API URL (e.g. `https://<backend>.up.railway.app/api`) if you prefer a separate backend service.

3. Quick deploy in a single Railway service

If you want to run both in a single Railway service (not recommended for production), build both and ensure the frontend server proxies `/api` to the backend. The repository already contains a frontend server runner that serves static assets from `frontend/dist/client` and loads the SSR bundle from `frontend/dist/server`.

4. Local development

- Install dependencies from the repo root:

```bash
npm run install
```

- Build backend and frontend:

```bash
npm run backend:build
npm run frontend:build
```

- Start backend (in a separate terminal):

```bash
npm run backend:start
```

- Start frontend (in a separate terminal):

```bash
npm run frontend:start
```

- The frontend SSR server listens on the `PORT` environment variable (defaults to 3000 locally). The frontend expects the API at `/api` by default (configured in `frontend/.env`).

5. Notes

- For production, set `VITE_API_URL` to the correct backend URL at build time if the backend is hosted separately.
- If you need help setting up Railway services for frontend/backend, I can provide step-by-step commands.

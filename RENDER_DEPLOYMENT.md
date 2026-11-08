# Deploying Honey Enterprises ERP to Render

This project is fully configured to deploy on **[Render](https://render.com/)**.

---

## 💡 Why Fullstack Single-Service Deployment is Recommended on Free Tier

Render's Free plan grants **750 free instance hours per month** across your entire account.
- **1 Web Service (Fullstack)**: Consumes ~720 hours/month, which stays **within the 750 free hours** indefinitely!
- **2 Web Services (Separate Frontend & Backend)**: Consumes 720 × 2 = **1,440 hours/month**, which will exhaust your free hours halfway through the month and shut down both services.

For this reason, this project includes an orchestrator (`start.js` and `frontend/runner.js`) that runs both the Express backend and the TanStack Start frontend securely within **a single Render Web Service**.

---

## 🚀 Option 1: One-Click Blueprint Deployment (Recommended)

Render uses `render.yaml` to configure everything automatically.

1. **Push your updated project code to GitHub or GitLab**.
2. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
3. Click **New +** > **Blueprint**.
4. Connect your GitHub/GitLab repository.
5. Render will automatically detect `render.yaml`.
6. Fill in the prompted environment variable:
   - **`DATABASE_URL`**: Your Neon PostgreSQL connection string:
     ```
     postgresql://neondb_owner:npg_ho9GCEpdely8@ep-holy-cloud-aotyzmig-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
7. Click **Apply**.
8. Render will build and deploy the entire application!

---

## 🛠️ Option 2: Manual Web Service Deployment (Single Fullstack Service)

If you prefer to configure manually via the Render UI:

1. In Render Dashboard, click **New +** > **Web Service**.
2. Select your repository.
3. Configure the service:
   - **Name**: `honeyent`
   - **Region**: `Singapore` (recommended since your Neon DB is in `ap-southeast-1`)
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm run build:all`
   - **Start Command**: `node start.js`
   - **Instance Type**: `Free`
4. Add the following **Environment Variables**:
   | Key | Value | Note |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production mode |
   | `DATABASE_URL` | `postgresql://neondb_owner:npg_ho9GCEpdely8@ep-holy-cloud-aotyzmig-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | Your Neon database string |
   | `JWT_SECRET` | *(click 'Generate' or enter a strong secret)* | Used for signing auth tokens |
   | `JWT_EXPIRE` | `7d` | Token expiry duration |
   | `VITE_API_URL` | `/api` | Relative proxy URL |
5. Click **Deploy Web Service**.

---

## 🔀 Option 3: Separate Backend and Frontend Services

If you have upgraded Render or want distinct services:

### 1. Backend Web Service
- **Name**: `honeyent-backend`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `DATABASE_URL`: Your Neon PostgreSQL connection string
  - `JWT_SECRET`: Your secure secret
  - `FRONTEND_URL`: `https://honeyent-frontend.onrender.com`

### 2. Frontend Web Service
- **Name**: `honeyent-frontend`
- **Root Directory**: `frontend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `BACKEND_URL`: `https://honeyent-backend.onrender.com`
  - `VITE_API_URL`: `/api` (or `https://honeyent-backend.onrender.com/api`)

---

## 🔍 How Free Tier Sleep / Cold Starts Work on Render

- Free web services on Render spin down after 15 minutes of inactivity.
- When someone visits your URL, Render will wake the service up in approximately 30–50 seconds.
- Once awake, response times are fast and normal.
- Your database is hosted on **Neon**, which is completely independent of Railway and persists all your data safely.


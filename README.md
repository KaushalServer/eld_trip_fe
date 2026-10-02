# ELD Trip Planner Frontend

React + Vite + Redux Toolkit frontend.

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_URL=http://localhost:4000/api` and `VITE_MOCK_MODE=false`.
3. `npm install`
4. `npm run dev`

Redux manages auth and trips. Authentication itself persists through the backend HTTP-only cookie; on a hard refresh the app dispatches `restoreSession()` and calls `/api/auth/me/` before rendering the authenticated workspace.

## Deployment
Set `VITE_API_URL=https://your-backend-domain/api` in the frontend host and rebuild/redeploy.

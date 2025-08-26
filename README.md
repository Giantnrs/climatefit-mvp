# ClimateFit MVP v2 (aligned to design)
- Frontend (Next.js 14 + Tailwind + react-leaflet) in `frontend/`
- Backend (ASP.NET Core 8 minimal API) in `backend/ClimateFit.Api/`

## Run
Backend:
  cd backend/ClimateFit.Api
  dotnet restore
  dotnet run

Frontend:
  cd frontend
  npm i
  copy .env.local.example .env.local   # Windows; use cp on macOS/Linux
  npm run dev

Pages:
  - /          Home with map (layer toggle) + timeline + CTA
  - /login     Login/Sign-up/Forgot (three-in-one)
  - /onboarding Rich questionnaire (sliders + city multi)
  - /results   Top 3 cards
  - /profile   User profile + preferences + history
  - /env-test  Verify API base URL

API:
  POST /auth/register
  POST /auth/login
  POST /auth/forgot
  GET  /profile
  PUT  /profile/preferences
  POST /results
  GET  /health

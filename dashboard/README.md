# PlantSaaS Admin Dashboard

A modern React + Vite dashboard for your Plant Disease Detection SaaS.

## Features

- **Master Key login** (in-memory auth)
- **Usage analytics** (charts from `/usage` endpoint)
- **Cloudinary image gallery** (recent predictions, filterable)
- **Low-confidence prediction trends**
- **API key management** (view, revoke, regenerate, assign quota)

## Tech Stack
- React + Vite
- Recharts (charts)
- Axios (API calls)
- Tailwind CSS (UI)

## Getting Started

1. `cd dashboard`
2. `npm install`
3. `npm run dev`

Set your backend API URL and master key in `.env` or at login.

---

**Pages:**
- `/login` — Master Key login
- `/dashboard` — Usage analytics
- `/images` — Cloudinary gallery
- `/keys` — API key management

---

**Built for PlantSaaS.** 
# resqpk-hospital

React hospital dashboard for **ResQPK** — a smart emergency-response system (FYP).

## Stack
- React + Vite, Tailwind CSS v3
- react-router-dom, Zustand (state), TanStack Query, axios
- Framer Motion, Recharts, react-hot-toast, lucide-react
- Socket.io client, react-leaflet + MapTiler (maps)
- Node/Express + Supabase backend

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and set `VITE_API_URL`
3. `npm run dev` (http://localhost:5173)

`.env` is git-ignored and must never be committed.

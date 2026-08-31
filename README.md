# FlowScape 🌍🛡️

> **AI-Driven Dynamic Scheduling, Real-Time Heatmaps & Crowd Gamification for Heritage Tourism**

FlowScape is a comprehensive end-to-end platform built to proactively manage visitor footfall in high-density heritage sites (like Shaniwar Wada, Gateway of India, and Ajanta Caves). By utilizing predictive time-slot suggestions, dynamic micro-incentives, and real-time live monitoring, FlowScape naturally disperses crowds while providing site administrators with bird's-eye monitoring and emergency broadcast capabilities.

## 🚀 Live Demos

- **Tourist Web App:** [https://flow-scape.vercel.app](https://flow-scape.vercel.app)
- **Admin Dashboard:** _(Running locally for live Mapbox admin capabilities)_
- **Backend API:** [https://flowscape.onrender.com/docs](https://flowscape.onrender.com/docs)

## ✨ Key Features

### For Tourists (Gamified Mobile App)

- **Dynamic City Context (GPS-Powered):** The app automatically detects your location (Web/Mobile GPS) and snaps the UI, maps, and recommended trails to the nearest major heritage hub in Maharashtra (e.g., Pune, Mumbai, Aurangabad, Nashik, Nagpur, Kolhapur).
- **Gamified Routing & Rewards:** AI-driven scheduling suggests off-peak departure time slots (e.g., earn 150 points for booking during low-density windows) when current capacity hits critical levels. Use points for heritage badges and perks.
- **Real-Time Heatmaps:** View live density zones right on your phone via Mapbox GL.
- **Emergency Broadcasts:** Instant WebSocket alerts pushed directly to the app if an area is temporarily closed by admins.

### For Site Managers (Admin Dashboard)

- **Live Crowd Distribution:** A beautiful React + Mapbox GL interface visualizing real-time crowd densities (Green/Yellow/Red zones) across historical sites.
- **Command Center:** Instantly broadcast override alerts (e.g., "Sudden crowd surge, re-routing recommended") to all active mobile users on the premises via WebSockets.

## 💻 Tech Stack

- **Backend:** Python, FastAPI, WebSockets, Joblib (ML Models)
- **Database:** Supabase (PostgreSQL), REST APIs
- **Admin Dashboard:** React.js, Vite, TailwindCSS, Mapbox GL (`react-map-gl`), Lucide Icons
- **Tourist App:** React Native, Expo Web, Expo Location

## 🛠️ Local Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new Supabase project.
2. Run the `schema.sql` file in the Supabase SQL Editor.
3. Grab your `URL` and `Anon Key`.

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Create a .env file with SUPABASE_URL and SUPABASE_KEY
uvicorn main:app --reload --port 8000
```

### 3. Admin Dashboard

```bash
cd admin-dashboard
npm install
# Create a .env file with VITE_SUPABASE_URL, VITE_SUPABASE_KEY, and VITE_MAPBOX_TOKEN
npm run dev
```

### 4. Tourist Mobile App

```bash
cd tourist-app
npm install
npx expo start -w
```

# FlowScape 🌍

> AI-driven dynamic scheduling and crowd management for tourist destinations.

FlowScape is a comprehensive end-to-end MVP built to proactively manage visitor footfall in high-density areas. By utilizing predictive time-slot suggestions and dynamic micro-incentives, FlowScape naturally disperses crowds while providing site administrators with real-time bird's-eye monitoring and emergency broadcast capabilities.

## 🚀 Features

### For Tourists (Mobile App)
- **Dynamic Pricing & Incentives:** AI-driven mockups suggest off-peak time slots (e.g., 20% discounts for booking tomorrow at 8 AM) when current capacity hits critical levels.
- **Real-Time Heatmaps:** View live density zones right on your phone.
- **Emergency Broadcasts:** Instant WebSocket alerts pushed directly to the app if an area is temporarily closed.

### For Site Managers (Admin Dashboard)
- **Live Crowd Distribution:** A beautiful React + Mapbox GL interface visualizing real-time crowd densities (Green/Yellow/Red zones).
- **Command Center:** Instantly broadcast override alerts to all active mobile users on the premises.

## 💻 Tech Stack

- **Backend:** Python, FastAPI, WebSockets
- **Database:** Supabase (PostgreSQL), REST APIs
- **Web Admin Dashboard:** React.js, Vite, Mapbox GL (`react-map-gl`), Lucide Icons
- **Mobile App:** React Native, Expo Web, `react-native-maps`

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

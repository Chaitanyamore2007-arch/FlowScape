from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from models import Venue, Zone, BookingCreate, Booking
from typing import List
import asyncio
import random
import os
from pathlib import Path
import joblib
import datetime
import pandas as pd
import json
import redis
from twilio.rest import Client

# Setup Redis (Upstash)
REDIS_URL = os.environ.get("UPSTASH_REDIS_URL")
if REDIS_URL:
    try:
        r = redis.from_url(REDIS_URL)
        print("Connected to Upstash Redis")
    except Exception as e:
        print("Redis connection failed:", e)
        r = None
else:
    r = None

# Setup Twilio
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')
TEST_USER_PHONE = os.environ.get('TEST_USER_PHONE')


app = FastAPI(title="FlowScape MVP API")

ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'https://flow-scape.vercel.app,http://localhost:8081,http://localhost:5173').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", summary="Health check", description="Returns API status.")
def read_root():
    return {"message": "Welcome to FlowScape MVP API"}

@app.get("/venues", response_model=List[Venue], summary="List venues", description="Returns all heritage tourist venues.")
def get_venues():
    response = supabase.table("venues").select("*").execute()
    return response.data

@app.get("/venues/{venue_id}/zones", response_model=List[Zone], summary="Get venue zones", description="Returns all density monitoring zones for a venue.")
def get_zones(venue_id: str):
    response = supabase.table("zones").select("*").eq("venue_id", venue_id).execute()
    return response.data

@app.post("/bookings", response_model=Booking, summary="Create booking", description="Books a time slot and optionally sends WhatsApp confirmation via Twilio.")
def create_booking(booking: BookingCreate, user_id: str = "mock-user-uuid"):
    data = {
        "user_id": user_id,
        "venue_id": str(booking.venue_id),
        "start_time": booking.start_time.isoformat(),
        "end_time": booking.end_time.isoformat(),
        "status": "CONFIRMED"
    }
    response = supabase.table("bookings").insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Booking failed")
    
    # 1. Cache the booking in Redis (Upstash)
    if r:
        try:
            r.setex(f"booking:{response.data[0]['id']}", 3600, json.dumps(data))
        except Exception as e:
            print("Redis cache failed:", e)

    # 2. Send WhatsApp Confirmation via Twilio
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TEST_USER_PHONE:
        try:
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            # Format time for display
            time_display = booking.start_time.strftime("%I:%M %p")
            msg = f"FlowScape: Your slot at Shaniwar Wada is confirmed for {time_display}. Current capacity: 22% (Low). Earn 50 bonus points for early arrival!"
            client.messages.create(
                from_=TWILIO_WHATSAPP_NUMBER,
                body=msg,
                to=f"whatsapp:{TEST_USER_PHONE}"
            )
            print("WhatsApp confirmation sent successfully!")
        except Exception as e:
            print(f"Twilio WhatsApp failed: {e}")

    return response.data[0]

# WebSockets for Heatmaps

try:
    rf_model = joblib.load(Path(__file__).parent / "density_model.joblib")
    print("Successfully loaded Random Forest Model!")
except Exception as e:
    rf_model = None
    print("Warning: Could not load ML model, falling back to random:", e)

@app.websocket("/ws/heatmaps")
async def websocket_heatmaps(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Fetch zones from Supabase
            response = supabase.table("zones").select("id").execute()
            zones = response.data
            
            updates = []
            now = datetime.datetime.now()
            
            for zone in zones:
                if rf_model:
                    # Feed real-time live variables into the Random Forest
                    # (time, day, holiday status, and varied temperature per zone)
                    input_df = pd.DataFrame([{
                        'time_of_day': now.hour,
                        'day_of_week': now.weekday(),
                        'is_holiday': 0, # Could be hooked up to a holiday API
                        'weather_temp': 32 + random.randint(-3, 3) 
                    }])
                    status = rf_model.predict(input_df)[0]
                else:
                    status = random.choice(["GREEN", "YELLOW", "RED"])
                    
                updates.append({"zone_id": zone["id"], "status": status})
                
            await websocket.send_json({"type": "DENSITY_UPDATE", "data": updates})
            await asyncio.sleep(5) # Push every 5 seconds
    except Exception as e:
        print(f"WebSocket Error: {e}")

# WebSockets for Alerts
active_alert_connections = []

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await websocket.accept()
    active_alert_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep connection open
    except Exception:
        if websocket in active_alert_connections:
            active_alert_connections.remove(websocket)

@app.post("/admin/broadcast", summary="Broadcast emergency alert", description="Sends a real-time alert to all connected tourist app users via WebSocket.")
async def broadcast_alert(message: str):
    failed = []
    for connection in active_alert_connections:
        try:
            await connection.send_json({"type": "ALERT", "message": message})
        except Exception:
            failed.append(connection)
    for conn in failed:
        active_alert_connections.remove(conn)
    return {"message": "Alert broadcasted", "recipients": len(active_alert_connections)}

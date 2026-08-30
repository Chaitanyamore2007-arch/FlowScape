import os

path = "backend/main.py"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add Twilio & Redis Imports
imports_hook = "from pydantic import BaseModel"
new_imports = """from pydantic import BaseModel
from twilio.rest import Client
import redis
import json

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
TEST_USER_PHONE = os.environ.get('TEST_USER_PHONE') # The judge's/user's phone number
"""
code = code.replace(imports_hook, new_imports)

# 2. Modify POST /bookings to send WhatsApp and Cache to Redis
old_bookings = """@app.post("/bookings", response_model=Booking)
def create_booking(booking: BookingCreate, user_id: str = "mock-user-uuid"):
    # In a real app, user_id comes from Auth token
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
    return response.data[0]"""

new_bookings = """@app.post("/bookings", response_model=Booking)
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
            msg = f"FlowScape: Your slot at Shaniwar Wada is confirmed for {time_display}. Current capacity: 22% (Low). Earn 50 bonus points for early arrival! 🏛️"
            client.messages.create(
                from_=TWILIO_WHATSAPP_NUMBER,
                body=msg,
                to=f"whatsapp:{TEST_USER_PHONE}"
            )
            print("WhatsApp confirmation sent successfully!")
        except Exception as e:
            print(f"Twilio WhatsApp failed: {e}")

    return response.data[0]"""
code = code.replace(old_bookings, new_bookings)

with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print("Backend updated with Twilio and Redis.")

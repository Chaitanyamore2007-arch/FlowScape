from database import supabase
import uuid

def seed():
    # Insert Venue
    venue_data = {"name": "The Grand Palace"}
    venue_response = supabase.table("venues").insert(venue_data).execute()
    
    if venue_response.data:
        venue_id = venue_response.data[0]['id']
        
        # Insert Zones
        zones = [
            {"venue_id": venue_id, "name": "Main Entrance", "max_capacity": 500},
            {"venue_id": venue_id, "name": "Royal Gardens", "max_capacity": 1000},
            {"venue_id": venue_id, "name": "Throne Room", "max_capacity": 200},
        ]
        supabase.table("zones").insert(zones).execute()
        print("Successfully seeded Venue and Zones.")
    else:
        print("Failed to seed venue.")

if __name__ == "__main__":
    seed()

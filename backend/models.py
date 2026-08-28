from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class Venue(BaseModel):
    id: UUID
    name: str
    created_at: datetime

class Zone(BaseModel):
    id: UUID
    venue_id: UUID
    name: str
    max_capacity: int
    created_at: datetime

class BookingCreate(BaseModel):
    venue_id: UUID
    start_time: datetime
    end_time: datetime

class Booking(BookingCreate):
    id: UUID
    user_id: UUID
    status: str
    created_at: datetime

class Incentive(BaseModel):
    id: UUID
    venue_id: UUID
    target_time: datetime
    reward_type: str
    reward_value: str
    is_active: bool
    created_at: datetime

class SimulatedDensityLog(BaseModel):
    id: UUID
    zone_id: UUID
    timestamp: datetime
    current_count: int
    density_status: str

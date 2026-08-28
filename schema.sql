-- Schema for FlowScape

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Venues
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Zones
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    max_capacity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Profiles (Linked to Supabase Auth)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'CONFIRMED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Incentives (Dynamic Rewards)
CREATE TABLE incentives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    target_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reward_type TEXT NOT NULL, -- e.g., 'DISCOUNT', 'FAST_TRACK', 'VOUCHER'
    reward_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Simulated Density Logs (Time-series Mock Data)
CREATE TABLE simulated_density_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_count INTEGER NOT NULL,
    density_status TEXT NOT NULL -- 'GREEN', 'YELLOW', 'RED'
);

-- Set up Row Level Security (RLS)

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venues are visible to everyone" ON venues FOR SELECT USING (true);
CREATE POLICY "Allow anon inserts for MVP setup" ON venues FOR INSERT WITH CHECK (true);

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zones are visible to everyone" ON zones FOR SELECT USING (true);
CREATE POLICY "Allow anon inserts for MVP setup" ON zones FOR INSERT WITH CHECK (true);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE incentives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Incentives are visible to everyone" ON incentives FOR SELECT USING (true);
CREATE POLICY "Allow anon inserts for MVP setup" ON incentives FOR INSERT WITH CHECK (true);

ALTER TABLE simulated_density_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Density logs are visible to everyone" ON simulated_density_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon inserts for MVP setup" ON simulated_density_logs FOR INSERT WITH CHECK (true);

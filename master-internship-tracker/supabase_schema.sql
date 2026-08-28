-- Create internships table
CREATE TABLE internships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tier INTEGER CHECK (tier IN (1, 2, 3)) NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    direct_link TEXT NOT NULL,
    location TEXT NOT NULL,
    posted_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hr_contacts table with a foreign key to internships
CREATE TABLE hr_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    internship_id UUID REFERENCES internships(id) ON DELETE CASCADE,
    hr_name TEXT NOT NULL,
    linkedin_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster querying and filtering by the frontend
CREATE INDEX idx_internships_tier ON internships(tier);
CREATE INDEX idx_internships_posted_time ON internships(posted_time);
CREATE INDEX idx_hr_contacts_internship_id ON hr_contacts(internship_id);

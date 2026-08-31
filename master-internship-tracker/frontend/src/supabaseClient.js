import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ezvnmjnqushpjizcavbe.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dm5tam5xdXNocGppemNhdmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDM3MzQsImV4cCI6MjEwMzM3OTczNH0.2w-JobmztNKJgdPPFYCt3j_dpfIF4_Rhy776wWCLpFc";

export const supabase = createClient(supabaseUrl, supabaseKey);

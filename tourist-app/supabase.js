import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://czmnjljwvwrosphzpvvr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bW5qbGp3dndyb3NwaHpwdnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MjkyMDIsImV4cCI6MjEwMzMwNTIwMn0.1vt-p7YvYizoEHG2PjSeRb8PP3vixuUjbxJ4O5jGXc4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

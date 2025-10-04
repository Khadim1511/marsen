import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bubbyjwomfnxwfphipwn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1YmJ5andvbWZueHdmcGhpcHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDA0OTksImV4cCI6MjA3MzgxNjQ5OX0.pYhlOjOS32nU1WrHg0JOF2MO-flMGhTTIydhHx-KEOY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
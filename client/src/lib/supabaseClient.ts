// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iquwsfyqcodqyvklbptb.supabase.co'; // Actual URL of my Supabase project
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxdXdzZnlxY29kcXl2a2xicHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MTMzMzEsImV4cCI6MjA2MTI4OTMzMX0.MnZGYhf4poFzDRpDzaIXq8tEA97tUEkPkNigiDleK8g'; // Actual anon key of my Supabase project

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
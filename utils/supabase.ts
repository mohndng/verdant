import { createClient } from '@supabase/supabase-js';

// Hardcoded fallbacks provided for this session
const FALLBACK_URL = 'https://wvglnqgmpomhxbomwekh.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2xucWdtcG9taHhib213ZWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzA0MzgsImV4cCI6MjA3OTc0NjQzOH0.6rimDDz6Ath021BZsQ94WQTYQTnPD6dyYtL1_K7qqXI';

// Safely retrieve environment variables checking both process.env and import.meta.env
const getEnvVar = (key: string, fallback: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', FALLBACK_URL);
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY', FALLBACK_KEY);

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
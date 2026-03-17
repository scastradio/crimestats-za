import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dcxsszflxgksfdlnaten.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjeHNzemZseGdrc2ZkbG5hdGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTEyNjksImV4cCI6MjA4OTI4NzI2OX0.gnybxKHBvJS1AysVY9F_Gl0o5UOblmaadIQIIceG-Po'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side only — full access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

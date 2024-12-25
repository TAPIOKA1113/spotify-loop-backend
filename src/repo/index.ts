import { createClient } from '@supabase/supabase-js'

const isProd = process.env.NODE_ENV === 'production'

const supabaseUrl = isProd
  ? process.env.SUPABASE_URL!
  : 'http://localhost:54321'

const supabaseKey = isProd
  ? process.env.SUPABASE_ANON_KEY!
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
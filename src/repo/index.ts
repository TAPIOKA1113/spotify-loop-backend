import { createClient } from '@supabase/supabase-js'

const isProd = false

const supabaseUrl = isProd
  ? 'https://fnozrjnxuszijdyqzenb.supabase.co'
  : 'http://localhost:54321'

const supabaseKey = isProd
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZub3pyam54dXN6aWpkeXF6ZW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwMTEzODgsImV4cCI6MjA1MDU4NzM4OH0.KBiXx3WLcAYiDCgyjS3r3No-BQQTUuwUd3wUgZJ6qtY'
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase

import { createClient } from '@supabase/supabase-js'

// Credenciales de tu proyecto de Supabase
const supabaseUrl = 'https://mtzyyvgsbsrghqgngazi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10enl5dmdzYnNyZ2hxZ25nYXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTg2OTQsImV4cCI6MjA2NjI3NDY5NH0.S8VELunl4Uu9G_K6cI-8K4ZE2uyjJdqqmCwNtDk28F0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Para funciones que requieren service role (solo usar en backend seguro)
export const supabaseServiceRole = createClient(
  supabaseUrl,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10enl5dmdzYnNyZ2hxZ25nYXppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY5ODY5NCwiZXhwIjoyMDY2Mjc0Njk0fQ.VMZXOpcBspy8jKGTqMJntS_zHrM2Yrf9AXG8GXLcsPs'
)

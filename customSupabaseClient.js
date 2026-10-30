import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://etkrcixshajypekiqgdx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3JjaXhzaGFqeXBla2lxZ2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTU5NjAsImV4cCI6MjA3NTU5MTk2MH0.VoNxNabLSwDgMB4quhi364yBxYsGoKWSH3oTLzK1SGA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
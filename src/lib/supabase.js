import { createClient } from '@supabase/supabase-js';

// بنجيب بيانات الاتصال من ملف .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// بنعمل عميل (client) متصل بمشروعك
export const supabase = createClient(supabaseUrl, supabaseKey);

import { supabase } from '../lib/supabase';

// ثابت مؤقت لمالك البورتفوليو (لحد ما نفعّل Auth)
export const OWNER_ID = '2879fbac-5aec-4ccf-8527-18459547c72a';

// ===========================================
// 🔹 جلب بيانات البروفايل
export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;   // ممكن تكون null لو مفيش بيانات لسه
}

// ===========================================
// 🔹 تحديث أو إضافة البروفايل
export async function upsertProfile(profile) {
  const record = {
    id: profile.id || OWNER_ID,
    name: profile.name ?? '',
    about: profile.about ?? '',
    avatar_url: profile.avatar_url ?? '',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

import { supabase } from '../lib/supabase';

// ثابت مؤقت لمالك البورتفوليو (لحد ما نفعّل Auth)
export const OWNER_ID = '2879fbac-5aec-4ccf-8527-18459547c72a'; // ← غيّر الـ id هنا لو مختلف عندك

// ===========================================
// 🔹 جلب بيانات البروفايل
export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', OWNER_ID)   // 👈 مهم جدًا
    .single();
  if (error) throw error;
  return data;
}


// ===========================================
// 🔹 تحديث أو إضافة البروفايل
export async function upsertProfile(profile) {
  const record = {
    id: OWNER_ID, // ← ثابت
    name: profile.name ?? '',
    about: profile.about ?? '',
    title: profile.title ?? '',
    avatar_url: profile.avatar_url ?? '',
    image: profile.image ?? null,
    phone: profile.phone ?? '',
    phone2: profile.phone2 ?? '',
    whatsapp: profile.whatsapp ?? '',
    socials: profile.socials ?? null, // لو جدولك فيه عمود JSONB اسمه socials
    cv: profile.cv ?? '',
    updated_at: new Date().toISOString(),

    // الحقول ثنائية اللغة (اختياري لو عندك)
    name_en: profile.name_en ?? '',
    name_ar: profile.name_ar ?? '',
    title_en: profile.title_en ?? '',
    title_ar: profile.title_ar ?? '',
    about_en: profile.about_en ?? '',
    about_ar: profile.about_ar ?? '',
    phoneLabel_en: profile.phoneLabel_en ?? '',
    phoneLabel_ar: profile.phoneLabel_ar ?? '',
    phone2Label_en: profile.phone2Label_en ?? '',
    phone2Label_ar: profile.phone2Label_ar ?? '',
  };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Profile updated on Supabase:', data);
    return data;
  } catch (err) {
    console.error('❌ upsertProfile error:', err);
    throw err;
  }
}

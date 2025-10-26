// src/services/cloudStorage.js
import { supabase } from '../lib/supabase'

// ثوابت
export const OWNER_ID = '1842096a-4577-4281-b5ae-eb9c9468727b';
const BUCKET = 'portfolio';

const PATHS = {
  avatar: (id, ext) => `images/${id}.${ext}`,
  cv:     (id)      => `cv/${id}.pdf`,
};

/* ---------- Utilities ---------- */
function dataURLtoBlob(dataURL) {
  if (!dataURL?.startsWith('data:')) return null
  const [meta, base64] = dataURL.split(',')
  const mime = meta.match(/data:(.*?);base64/)[1] || 'application/octet-stream'
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return new Blob([bytes], { type: mime })
}

async function uploadToStorage(bucket, path, blob, makePublic = true) {
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: blob.type,
    cacheControl: '3600', // اختياري
  })
  if (error) throw error

  if (makePublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    // نكسر الكاش في العرض فقط
    return `${data.publicUrl}?v=${Date.now()}`
  }
  const { data, error: signErr } = await supabase
    .storage.from(bucket).createSignedUrl(path, 3600)
  if (signErr) throw signErr
  return data.signedUrl
}

/* ---------- Reads ---------- */
export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', OWNER_ID)
    .maybeSingle(); // ما يرميش Error لو مفيش صف

  if (error) throw error;

  // تطبيع بسيط عشان الـ UI يتعامل مع المفاتيح
  if (data) {
    data.image = data.image ?? data.image_url ?? '';
    data.cv    = data.cv ?? data.cv_url ?? '';
    if (typeof data.socials !== 'object' || data.socials === null) data.socials = {};
  }
  return data || null;
}

/* ---------- Writes ---------- */
/* ---------- Writes ---------- */
export async function upsertProfile(profile) {
  const p = { ...profile };

  // صورة Base64 → URL
  if (typeof p.image === 'string' && p.image.startsWith('data:')) {
    const blob = dataURLtoBlob(p.image);
    if (blob) {
      const ext  = blob.type.includes('png') ? 'png' : 'jpg';
      const path = PATHS.avatar(OWNER_ID, ext);
      p.image_url = await uploadToStorage(BUCKET, path, blob, true);
    }
    delete p.image; // ما نبعتش image للجدول
  }

  // PDF Base64 → URL (أو مسحه)
  if (typeof p.cv === 'string' && p.cv.startsWith('data:application/pdf')) {
    const blob = dataURLtoBlob(p.cv);
    if (blob) {
      const path = PATHS.cv(OWNER_ID);
      p.cv_url = await uploadToStorage(BUCKET, path, blob, true);
    }
    delete p.cv;
  } else if (p.cv === '') {
    p.cv_url = null;
    delete p.cv;
  }

  // املأ *_en/*_ar لو فيه قيم عامة
  const ensure = (k) => {
    p[`${k}_en`] = p[`${k}_en`] ?? p[k] ?? '';
    p[`${k}_ar`] = p[`${k}_ar`] ?? p[k] ?? '';
    delete p[k];
  };
  ['name','title','about','phoneLabel','phone2Label'].forEach(ensure);

  // jsonb صريح
  p.socials = (p.socials && typeof p.socials === 'object') ? p.socials : {};

  // مفاتيح أساسية
  p.id = OWNER_ID;
  p.updated_at = new Date().toISOString();

  // ✅ اسمح فقط بأعمدة الجدول
  const allowed = [
    'id','name_en','name_ar','title_en','title_ar','about_en','about_ar',
    'phone','phone2','whatsapp','phoneLabel_en','phoneLabel_ar',
    'phone2Label_en','phone2Label_ar','image_url','cv_url','socials','updated_at'
  ];
  const record = Object.fromEntries(
    Object.entries(p).filter(([k, v]) => allowed.includes(k) && v !== undefined)
  );

  // لوج قبل الحفظ للتشخيص
  console.log('record to upsert', record);

  // ✅ upsert واحد فقط
  const { data, error } = await supabase
    .from('profiles')
    .upsert(record, { onConflict: 'id' })
    .select()
    .maybeSingle(); // أهدى من single() في بعض الحالات

  if (error) {
    console.error('❌ upsert error', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }

  return data;
}

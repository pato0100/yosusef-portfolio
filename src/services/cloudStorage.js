// src/services/cloudStorage.js
import { supabase } from '../lib/supabase'

// ثوابت
export const OWNER_ID = '1842096a-4577-4281-b5ae-eb9c9468727b'
const BUCKET = 'portfolio'

const PATHS = {
  avatar: (id, ext) => `images/${id}.${ext}`,
  cv:     (id)      => `cv/${id}.pdf`,
}

/* ---------- Utilities ---------- */
function dataURLtoBlob(dataURL) {
  if (!dataURL?.startsWith('data:')) return null
  const [meta, base64] = dataURL.split(',')
  const mime = meta.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream'
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return new Blob([bytes], { type: mime })
}

async function uploadToStorage(bucket, path, blob, makePublic = true) {
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: blob.type,
    cacheControl: '3600',
  })
  if (error) throw error

  if (makePublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return `${data.publicUrl}?v=${Date.now()}`
  }
  const { data, error: signErr } = await supabase
    .storage.from(bucket)
    .createSignedUrl(path, 3600)
  if (signErr) throw signErr
  return data.signedUrl
}

/* ---------- Reads ---------- */
export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', OWNER_ID)
    .maybeSingle()

  if (error) throw error

  if (data) {
    // تطبيع مفاتيح الملفات
    data.image = data.image ?? data.image_url ?? ''
    data.cv    = data.cv ?? data.cv_url ?? ''
    if (typeof data.socials !== 'object' || data.socials === null) data.socials = {}

    // تطبيع أسماء الأعمدة snake_case -> camelCase للواجهة
    data.phoneLabel_en  = data.phone_label_en  ?? data.phoneLabel_en
    data.phoneLabel_ar  = data.phone_label_ar  ?? data.phoneLabel_ar
    data.phone2Label_en = data.phone2_label_en ?? data.phone2Label_en
    data.phone2Label_ar = data.phone2_label_ar ?? data.phone2Label_ar
  }

  return data || null
}

/* ---------- Writes ---------- */
export async function upsertProfile(profile) {
  const p = { ...profile }

  // صورة Base64 → URL
  if (typeof p.image === 'string' && p.image.startsWith('data:')) {
    const blob = dataURLtoBlob(p.image)
    if (blob) {
      const ext  = blob.type.includes('png') ? 'png' : 'jpg'
      const path = PATHS.avatar(OWNER_ID, ext)
      p.image_url = await uploadToStorage(BUCKET, path, blob, true)
    }
    delete p.image
  }

  // PDF Base64 → URL (أو مسحه)
  if (typeof p.cv === 'string' && p.cv.startsWith('data:application/pdf')) {
    const blob = dataURLtoBlob(p.cv)
    if (blob) {
      const path = PATHS.cv(OWNER_ID)
      p.cv_url = await uploadToStorage(BUCKET, path, blob, true)
    }
    delete p.cv
  } else if (p.cv === '') {
    p.cv_url = null
    delete p.cv
  }

  // املأ *_en/*_ar لو فيه قيم عامة (للـUI)
  const ensure = (k) => {
    p[`${k}_en`] = p[`${k}_en`] ?? p[k] ?? ''
    p[`${k}_ar`] = p[`${k}_ar`] ?? p[k] ?? ''
    delete p[k]
  }
  ;['name','title','about','phoneLabel','phone2Label'].forEach(ensure)

  // jsonb صريح
  p.socials = (p.socials && typeof p.socials === 'object') ? p.socials : {}

  // مفاتيح أساسية
  p.id = OWNER_ID
  p.updated_at = new Date().toISOString()

  // ------ بناء record بأسماء أعمدة الداتابيز (snake_case) ------
  const record = {
    id: p.id,

    name_en: p.name_en,       name_ar: p.name_ar,
    title_en: p.title_en,     title_ar: p.title_ar,
    about_en: p.about_en,     about_ar: p.about_ar,

    phone: p.phone ?? null,
    phone2: p.phone2 ?? null,
    whatsapp: p.whatsapp ?? null,

    // مابّنج camelCase من الواجهة إلى snake_case في الجدول
    phone_label_en:  p.phoneLabel_en  ?? p.phone_label_en  ?? null,
    phone_label_ar:  p.phoneLabel_ar  ?? p.phone_label_ar  ?? null,
    phone2_label_en: p.phone2Label_en ?? p.phone2_label_en ?? null,
    phone2_label_ar: p.phone2Label_ar ?? p.phone2_label_ar ?? null,

    image_url: p.image_url ?? null,
    cv_url:    p.cv_url ?? null,
    socials:   p.socials,
    updated_at: p.updated_at,
  }

  // احذف أي undefined
  Object.keys(record).forEach(k => record[k] === undefined && delete record[k])

  // لوج تشخيصي
  console.log('record to upsert', record)

  const { data, error } = await supabase
    .from('profiles')
    .upsert(record, { onConflict: 'id' })
    .select()
    .maybeSingle()

  if (error) {
    console.error('❌ upsert error', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    throw error
  }

  return data
}

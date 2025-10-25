// src/services/cloudStorage.js
import { supabase } from '../lib/supabase'

// ثوابت
export const OWNER_ID = '5873b48f-ebfa-484d-b4a0-480ee97e67f2' // عدّل لو مختلف
const BUCKET_AVATAR = 'public'
const BUCKET_DOCS = 'docs'

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
    upsert: true, contentType: blob.type
  })
  if (error) throw error

  if (makePublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }
  const { data, error: signErr } = await supabase
    .storage.from(bucket).createSignedUrl(path, 3600)
  if (signErr) throw signErr
  return data.signedUrl
}

/* ---------- Reads ---------- */
export async function getProfile() {
  // استخدم maybeSingle عشان ما يرميش error لو مفيش صف
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', OWNER_ID)
    .maybeSingle()

  if (error) throw error
  return data || null
}

/* ---------- Upsert (مع رفع ملفات) ---------- */
export async function upsertProfile(profile) {
  // نحضّر نسخة قابلة للتخزين
  const p = { ...profile }

  // 1) لو الصورة جاية Base64: ارفعها وخلي image_url
  if (typeof p.image === 'string' && p.image.startsWith('data:')) {
    const blob = dataURLtoBlob(p.image)
    if (blob) {
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      const path = `avatars/${OWNER_ID}.${ext}?v=${Date.now()}`
      p.image_url = await uploadToStorage(BUCKET_AVATAR, path, blob, true)
    }
    delete p.image
  }

  // 2) لو PDF جاية Base64: ارفعها وخلي cv_url (أو امسحها لو فاضية)
  if (typeof p.cv === 'string' && p.cv.startsWith('data:application/pdf')) {
    const blob = dataURLtoBlob(p.cv)
    if (blob) {
      const path = `cv/${OWNER_ID}.pdf?v=${Date.now()}`
      p.cv_url = await uploadToStorage(BUCKET_DOCS, path, blob, true) // خليه true لو عايزه عام
    }
    delete p.cv
  } else if (p.cv === '') {
    p.cv_url = null
    delete p.cv
  }

  // 3) الحقول ثنائية اللغة: حافظ على *_en/*_ar لو جت قيم عامة
  const ensure = (k) => {
    p[`${k}_en`] = p[`${k}_en`] ?? p[k] ?? ''
    p[`${k}_ar`] = p[`${k}_ar`] ?? p[k] ?? ''
    delete p[k]
  }
  ;['name','title','about','phoneLabel','phone2Label'].forEach(ensure)

  // 4) socials JSONB
  p.socials = p.socials ?? {}

  // 5) مفاتيح أساسية
  p.id = OWNER_ID
  p.updated_at = new Date().toISOString()

  // 6) upsert على id
  const { data, error } = await supabase
    .from('profiles')
    .upsert(p, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

/* ---------- اختياري: إنشاء صف أولي لو مش موجود ---------- */
export async function ensureProfileDefaults(defaults = {}) {
  const existing = await getProfile()
  if (existing) return existing
  return upsertProfile(defaults)
}

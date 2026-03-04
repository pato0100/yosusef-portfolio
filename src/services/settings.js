// src/services/settings.js
import { supabase } from '../lib/supabase'

export const DEFAULT_SETTINGS = {
  defaultLang: 'en',
  defaultTheme: 'agogovich',
  showContactPage: true,
  showProjectsPage: true,
  showsendemail: true,
  showQR: true,
  showSocials: true,
  showDownloadCV: true,
  showDownloadVcard: true,
}

// =====================
// Helpers
// =====================

function fromDb(row = {}) {
  return {
    id: row.id ?? null,
    defaultLang: row.default_lang ?? DEFAULT_SETTINGS.defaultLang,
    defaultTheme: row.default_theme ?? DEFAULT_SETTINGS.defaultTheme,

    showContactPage: row.show_contact_page ?? DEFAULT_SETTINGS.showContactPage,
    showProjectsPage: row.show_projects_page ?? DEFAULT_SETTINGS.showProjectsPage,
    showsendemail: row.show_send_email ?? DEFAULT_SETTINGS.showsendemail,

    showQR: row.show_qr ?? DEFAULT_SETTINGS.showQR,
    showSocials: row.show_socials ?? DEFAULT_SETTINGS.showSocials,
    showDownloadCV: row.show_download_cv ?? DEFAULT_SETTINGS.showDownloadCV,
    showDownloadVcard: row.show_download_vcard ?? DEFAULT_SETTINGS.showDownloadVcard,

    // 🔥 مهم
    custom_theme: row.custom_theme ?? null
  }
}

function toDb(patch = {}) {
  return {
    default_lang: patch.defaultLang,
    default_theme: patch.defaultTheme,

    show_contact_page: patch.showContactPage,
    show_projects_page: patch.showProjectsPage,
    showsendemail: patch.showsendemail,

    show_qr: patch.showQR,
    show_socials: patch.showSocials,
    show_download_cv: patch.showDownloadCV,
    show_download_vcard: patch.showDownloadVcard,

    // 🔥 أهم سطر
    custom_theme: patch.custom_theme ?? null,

    updated_at: new Date().toISOString(),
  }
}

// =====================
// GET SETTINGS
// =====================

export async function getSettings(slug) {
  // 1️⃣ هات profile.id من slug
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', slug)
    .single()

  if (profileError || !profile) {
    console.error('⚠️ Profile not found for slug:', slug)
    return { ...DEFAULT_SETTINGS }
  }

  // 2️⃣ هات settings الخاصة بيه
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('owner_id', profile.id)
    .maybeSingle()

  if (error) {
    console.error('⚠️ getSettings error:', error)
    return { ...DEFAULT_SETTINGS }
  }

  if (data) return fromDb(data)

  return { ...DEFAULT_SETTINGS }
}

// =====================
// UPDATE SETTINGS
// =====================

export async function updateSettings(patch) {
  const { data: authData } = await supabase.auth.getUser()
  const uid = authData?.user?.id

  if (!uid) throw new Error('Not authenticated')

  const payload = {
    owner_id: uid,
    ...toDb(patch),
  }

  const { data, error } = await supabase
    .from('settings')
    .upsert(payload, { onConflict: 'owner_id' }) // 🔥 المهم هنا
    .select('*')
    .single()

  if (error) {
    console.error('⚠️ updateSettings error:', error)
    throw error
  }

  return fromDb(data)
}
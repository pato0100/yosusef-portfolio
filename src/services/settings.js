```javascript
// src/services/settings.js

import { supabase } from '../lib/supabase'

// =====================
// DEFAULT SETTINGS
// =====================

export const DEFAULT_SETTINGS = {
  defaultLang: 'en',
  defaultTheme: 'agogovich',

  showContactPage: true,
  showProjectsPage: true,
  showContactSection: true,

  showQR: true,
  showSocials: true,

  showDownloadCV: true,
  showDownloadVCard: true,
}

// =====================
// Helpers
// =====================

// تحويل من DB → Frontend
function fromDb(row = {}) {
  return {
    id: row.id ?? null,

    defaultLang: row.default_lang ?? DEFAULT_SETTINGS.defaultLang,
    defaultTheme: row.default_theme ?? DEFAULT_SETTINGS.defaultTheme,

    showContactPage:
      row.show_contact_page ?? DEFAULT_SETTINGS.showContactPage,

    showProjectsPage:
      row.show_projects_page ?? DEFAULT_SETTINGS.showProjectsPage,

    showContactSection:
      row.show_contact_section ?? DEFAULT_SETTINGS.showContactSection,

    showQR:
      row.show_qr ?? DEFAULT_SETTINGS.showQR,

    showSocials:
      row.show_socials ?? DEFAULT_SETTINGS.showSocials,

    showDownloadCV:
      row.show_download_cv ?? DEFAULT_SETTINGS.showDownloadCV,

    showDownloadVCard:
      row.show_download_vcard ?? DEFAULT_SETTINGS.showDownloadVCard,
  }
}

// تحويل من Frontend → DB
function toDb(patch = {}) {
  const db = {}

  if ('defaultLang' in patch) db.default_lang = patch.defaultLang
  if ('defaultTheme' in patch) db.default_theme = patch.defaultTheme

  if ('showContactPage' in patch) db.show_contact_page = patch.showContactPage
  if ('showProjectsPage' in patch) db.show_projects_page = patch.showProjectsPage
  if ('showContactSection' in patch) db.show_contact_section = patch.showContactSection

  if ('showQR' in patch) db.show_qr = patch.showQR
  if ('showSocials' in patch) db.show_socials = patch.showSocials

  if ('showDownloadCV' in patch) db.show_download_cv = patch.showDownloadCV
  if ('showDownloadVCard' in patch) db.show_download_vcard = patch.showDownloadVCard

  db.updated_at = new Date().toISOString()

  return db
}

// =====================
// GET SETTINGS
// =====================

export async function getSettings(slug) {
  try {

    // 1️⃣ الحصول على profile.id من slug
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (profileError || !profile) {
      console.warn('⚠️ Profile not found for slug:', slug)
      return { ...DEFAULT_SETTINGS }
    }

    // 2️⃣ الحصول على settings الخاصة باليوزر
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('owner_id', profile.id)
      .maybeSingle()

    if (error) {
      console.error('⚠️ getSettings error:', error)
      return { ...DEFAULT_SETTINGS }
    }

    if (!data) {
      return { ...DEFAULT_SETTINGS }
    }

    return fromDb(data)

  } catch (err) {
    console.error('⚠️ getSettings unexpected error:', err)
    return { ...DEFAULT_SETTINGS }
  }
}

// =====================
// UPDATE SETTINGS
// =====================

export async function updateSettings(patch) {

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData?.user) {
    throw new Error('User not authenticated')
  }

  const uid = authData.user.id

  const payload = {
    owner_id: uid,
    ...toDb(patch),
  }

  const { data, error } = await supabase
    .from('settings')
    .upsert(payload, { onConflict: 'owner_id' })
    .select('*')
    .single()

  if (error) {
    console.error('⚠️ updateSettings error:', error)
    throw error
  }

  return fromDb(data)
}
```

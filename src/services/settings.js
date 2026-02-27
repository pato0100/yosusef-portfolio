// src/services/settings.js
import { supabase } from '../lib/supabase'

// الحالة الافتراضية (camelCase في الواجهة)
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

function fromDb(row = {}) {
  return {
    id: row.id ?? null,
    defaultLang: row.default_lang ?? DEFAULT_SETTINGS.defaultLang,
    defaultTheme: row.default_theme ?? DEFAULT_SETTINGS.defaultTheme,
    showContactPage:    row.show_contact_page ?? DEFAULT_SETTINGS.showContactPage,
    showProjectsPage:   row.show_projects_page ?? DEFAULT_SETTINGS.showProjectsPage,
    showContactSection: row.show_contact_section ?? DEFAULT_SETTINGS.showContactSection,
    showQR:             row.show_qr ?? DEFAULT_SETTINGS.showQR,
    showSocials:        row.show_socials ?? DEFAULT_SETTINGS.showSocials,
    showDownloadCV:     row.show_download_cv ?? DEFAULT_SETTINGS.showDownloadCV,
    showDownloadVCard:  row.show_download_vcard ?? DEFAULT_SETTINGS.showDownloadVCard,
  }
}

function toDb(patch = {}) {
  return {
    default_lang: patch.defaultLang,
    default_theme: patch.defaultTheme,
    show_contact_page:    patch.showContactPage,
    show_projects_page:   patch.showProjectsPage,
    show_contact_section: patch.showContactSection,
    show_qr:              patch.showQR,
    show_socials:         patch.showSocials,
    show_download_cv:     patch.showDownloadCV,
    show_download_vcard:  patch.showDownloadVCard,
    updated_at: new Date().toISOString(),
  }
}

// =====================
// 🔥 GET SETTINGS (Public + Private)
// =====================

export async function getSettings() {
  // نحاول نجيب المستخدم — بدون ما نكسر لو مش موجود
  const { data: authData } = await supabase.auth.getUser()
  const uid = authData?.user?.id || null

  // 👤 لو فيه مستخدم → نحاول نجيب صفه
  if (uid) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', uid)
      .maybeSingle()

    if (!error && data) {
      return fromDb(data)
    }

    if (error) {
      console.error('⚠️ Private settings error:', error)
    }
  }

  // 🌍 لو مفيش مستخدم أو مفيش صف خاص → نجيب public
  const { data: publicRow, error: publicError } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'public')
    .maybeSingle()

  if (!publicError && publicRow) {
    return fromDb(publicRow)
  }

  if (publicError) {
    console.error('⚠️ Public settings error:', publicError)
  }

  // 🟡 fallback نهائي
  return { id: 'public', ...DEFAULT_SETTINGS }
}

// =====================
// 👤 UPDATE SETTINGS (خاص بالمستخدم فقط)
// =====================

async function getUidOrThrow() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user?.id)
    throw error || new Error('No authenticated user')
  return data.user.id
}

export async function updateSettings(patch) {
  const uid = await getUidOrThrow()
  const payload = { id: uid, ...toDb(patch) }

  const { data, error } = await supabase
    .from('settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    console.error('⚠️ updateSettings error:', error)
    throw error
  }

  return fromDb(data)
}
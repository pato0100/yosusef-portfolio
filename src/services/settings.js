// src/services/settings.js
import { supabase } from '../lib/supabase'

// شكل الحالة داخل الواجهة (camelCase)
export const DEFAULT_SETTINGS = {
  id: 'global',
  defaultLang: 'ar',
  defaultTheme: 'agogovich',
  showContactPage: true,
  showProjectsPage: true,
  showContactSection: true,
  showQR: true,
  showSocials: true,
  showDownloadCV: true,
  showDownloadVCard: true,
}

// من قاعدة البيانات (snake_case) → إلى الواجهة (camelCase)
function fromDb(row = {}) {
  return {
    id: row.id ?? 'global',
    defaultLang: row.default_lang ?? DEFAULT_SETTINGS.defaultLang,
    defaultTheme: row.default_theme ?? DEFAULT_SETTINGS.defaultTheme,
    showContactPage:   row.show_contact_page ?? DEFAULT_SETTINGS.showContactPage,
    showProjectsPage:  row.show_projects_page ?? DEFAULT_SETTINGS.showProjectsPage,
    showContactSection:row.show_contact_section ?? DEFAULT_SETTINGS.showContactSection,
    showQR:            row.show_qr ?? DEFAULT_SETTINGS.showQR,
    showSocials:       row.show_socials ?? DEFAULT_SETTINGS.showSocials,
    showDownloadCV:    row.show_download_cv ?? DEFAULT_SETTINGS.showDownloadCV,
    showDownloadVCard: row.show_download_vcard ?? DEFAULT_SETTINGS.showDownloadVCard,
  }
}

// من الواجهة (camelCase) → إلى قاعدة البيانات (snake_case)
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

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'global')
    .single()

  if (error) {
    // لو مفيش صف — رجّع الافتراضيات
    if (error.code === 'PGRST116') return { ...DEFAULT_SETTINGS }
    console.error('⚠️ getSettings error:', error)
    throw error
  }

  return fromDb(data)
}

export async function updateSettings(patch) {
  const payload = toDb(patch)
  // debug عند اللزوم: console.log('payload', payload)

  const { data, error } = await supabase
    .from('settings')
    .update(payload)     // ← بنبعت snake_case بس
    .eq('id', 'global')
    .select('*')
    .single()

  if (error) {
    console.error('⚠️ updateSettings error:', error)
    throw error
  }

  return fromDb(data)
}

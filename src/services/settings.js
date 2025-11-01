// src/services/settings.js
import { supabase } from '../lib/supabase'

// الحالة الافتراضية (camelCase في الواجهة)
export const DEFAULT_SETTINGS = {
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

// helpers
function fromDb(row = {}) {
  return {
    id: row.id ?? null,                    // uuid
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

async function getUidOrThrow() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user?.id) throw error || new Error('No authenticated user')
  return data.user.id
}

/**
 * اقرأ إعدادات المستخدم الحالي.
 * - يحاول يجلب صف المستخدم (id = auth.uid()).
 * - لو مش موجود: يعمل upsert بصف جديد بالافتراضيات ويرجّعه.
 * - (توافق للخلف): لو كان عندك صف global قديم ولسه الـRLS سامح، ممكن ترجع منه كـ fallback.
 */
export async function getSettings() {
  const uid = await getUidOrThrow()

  // 1) جرّب صف المستخدم
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', uid)
    .maybeSingle()

  if (error) {
    console.error('⚠️ getSettings error:', error)
    throw error
  }

  if (data) return fromDb(data)

  // 2) (اختياري) fallback لو عندك صف global عام ومسموح قراءته
  const { data: globalRow } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'global')
    .maybeSingle()

  if (globalRow) return fromDb(globalRow)

  // 3) لو مفيش حاجة خالص: أنشئ صف للمستخدم بالافتراضيات وأرجعه
  const payload = { id: uid, ...toDb(DEFAULT_SETTINGS) }
  const { data: created, error: upsertErr } = await supabase
    .from('settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (upsertErr) {
    console.error('⚠️ getSettings upsert default error:', upsertErr)
    // كمل على الافتراضيات على الأقل للواجهة
    return { id: uid, ...DEFAULT_SETTINGS }
  }

  return fromDb(created)
}

/**
 * حدّث إعدادات المستخدم الحالي (upsert آمن).
 */
export async function updateSettings(patch) {
  const uid = await getUidOrThrow()
  const payload = { id: uid, ...toDb(patch) }

  const { data, error } = await supabase
    .from('settings')
    .upsert(payload, { onConflict: 'id' }) // ينشئ لو مش موجود
    .select('*')
    .single()

  if (error) {
    console.error('⚠️ updateSettings error:', error)
    throw error
  }

  return fromDb(data)
}

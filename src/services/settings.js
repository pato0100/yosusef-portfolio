// src/services/settings.js
import { supabase } from '../lib/supabase'

// الإعدادات الافتراضية fallback
export const DEFAULT_SETTINGS = {
  id: 'global',
  defaultTheme: 'agogovich',
  defaultLang: 'ar',
  showContactPage: true,
  showProjectsPage: true,
  showContactSection: true,
  showQR: true,
  showSocials: true,
  showDownloadCV: true,
  showDownloadVCard: true,
}

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'global')
    .single()

  if (error) {
    // لو الجدول فاضي أو الصف مش موجود، رجع الافتراضيات
    if (error.code === 'PGRST116' || error.details?.includes('0 rows')) {
      return { ...DEFAULT_SETTINGS }
    }
    console.error('⚠️ getSettings error:', error)
    throw error
  }

  return { ...DEFAULT_SETTINGS, ...data }
}

export async function updateSettings(patch) {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 'global')
    .select()
    .single()

  if (error) {
    console.error('⚠️ updateSettings error:', error)
    throw error
  }

  return data
}

// src/utils/storage.js
const PROFILE_KEY = 'profile-data-v1'
const AUTH_KEY    = 'edit-auth-v1'
const THEME_KEY   = 'theme-v1'

export function loadProfile(defaults) {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function saveProfile(data) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('Failed to save profile:', e)
    return false
  }
}

export function setAuth(ok) {
  localStorage.setItem(AUTH_KEY, ok ? '1' : '0')
}
export function isAuthed() {
  return localStorage.getItem(AUTH_KEY) === '1'
}

/* =========================
   THEME (no-light policy)
   ========================= */
export function getTheme() {
  const t = localStorage.getItem(THEME_KEY)
  // أي قيمة ناقصة أو light ⇒ dark
  return (!t || t === 'light') ? 'dark' : t
}

export function setTheme(v) {
  // تطبيع المدخل: ممنوع light
  const value = (!v || v === 'light') ? 'dark' : v
  localStorage.setItem(THEME_KEY, value)
  return value
}

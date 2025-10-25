// src/pages/Profile.jsx
import { useEffect, useState } from 'react'
import defaultData from '../data/defaultProfile.json'
import ProfileCard from '../components/ProfileCard'
import { getProfile } from '../services/cloudStorage' // ⬅️ المهم

// دمج الديفولت مع الداتا الراجعة (بحيث أي حقل ناقص يتكمل)
function mergeDefaults(defaults, remote) {
  if (!remote) return defaults
  return { ...defaults, ...remote, socials: { ...(defaults.socials||{}), ...(remote.socials||{}) } }
}

export default function Profile() {
  const [profile, setProfile] = useState(defaultData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        // اختياري: اعرض كاش سريعاً
        const cache = localStorage.getItem('profile_cache')
        if (cache) setProfile(mergeDefaults(defaultData, JSON.parse(cache)))

        // بيانات حقيقية من Supabase
        const remote = await getProfile()
        const merged = mergeDefaults(defaultData, remote)
        setProfile(merged)

        // خزّن كاش للاستخدام لاحقًا
        localStorage.setItem('profile_cache', JSON.stringify(merged))
      } catch (e) {
        console.error('Failed to load profile:', e)
        // لو فشل، نظل على الديفولت/الكاش
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card p-6">Loading…</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <ProfileCard profile={profile} />
    </div>
  )
}

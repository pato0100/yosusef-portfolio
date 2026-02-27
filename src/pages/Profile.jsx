// src/pages/Profile.jsx
import { useEffect, useState } from 'react'
import defaultData from '../data/defaultProfile.json'
import ProfileCard from '../components/ProfileCard'
import { getProfile } from '../services/cloudStorage'

// دمج الديفولت مع الداتا الراجعة (أي حقل ناقص يتكمل)
function mergeDefaults(defaults, remote) {
  if (!remote) return defaults

  return {
    ...defaults,
    ...remote,
    socials: {
      ...(defaults.socials || {}),
      ...(remote.socials || {})
    }
  }
}

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const remote = await getProfile()
        const merged = mergeDefaults(defaultData, remote)
        setProfile(merged)
      } catch (error) {
        console.error('Failed to load profile:', error)
        setProfile(defaultData) // fallback آمن
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card p-6">Loading...</div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-8">
      <ProfileCard profile={profile} />
    </div>
  )
}
// src/pages/Profile.jsx

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import defaultData from '../data/defaultProfile.json'
import ProfileCard from '../components/ProfileCard'
import { supabase } from '../lib/supabase' // تأكد المسار صح
import { getSettings } from '../services/settings'


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
  const { slug } = useParams()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [settings, setSettings] = useState(null)

 useEffect(() => {
  const loadProfile = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // 🔥 أهم سطر
    data.image = data.image ?? data.image_url ?? ''
    data.cv    = data.cv ?? data.cv_url ?? ''

    const merged = mergeDefaults(defaultData, data)

setProfile(merged)

const settingsData = await getSettings(slug)
setSettings(settingsData)

setLoading(false)

  }

  loadProfile()
}, [slug])

  // Loading
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card p-6">Loading...</div>
      </div>
    )
  }

  // 404
  if (notFound) {
    return (
      <div className="text-center mt-20 text-2xl font-semibold">
        404 - User not found
      </div>
    )
  }

  if (!profile || !settings) return null

  return (
    <div className="space-y-8">
      <ProfileCard profile={profile} settings={settings} />
    </div>
  )
}
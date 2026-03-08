import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import defaults from '../../data/defaultProfile.json'
import { useI18n } from '../../i18n/i18n'
import { supabase, signOut } from '../../lib/supabase'
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '../../services/settings'
import { upsertProfile, getMyProfile } from '../../services/cloudStorage'

import ProfileManagement from './ProfileManagement'
import Settings from './Settings'
import ProjectManagement from './ProjectManagement'

export default function DashboardPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { slug: slugFromUrl } = useParams()

  const [activeTab, setActiveTab] = useState('profile')

  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [data, setData] = useState(defaults)
  const [profileCropping, setProfileCropping] = useState(null)

  const [username, setUsername] = useState('')
  const [slugValue, setSlugValue] = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [slugStatus, setSlugStatus] = useState(null)

  const usernameDebounceRef = useRef(null)
  const slugDebounceRef = useRef(null)

  const [editLang, setEditLang] = useState('en')

  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [settingsTab, setSettingsTab] = useState('general')
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [originalSettings, setOriginalSettings] = useState(DEFAULT_SETTINGS)

  const [customTheme, setCustomTheme] = useState({
    brand: '#00c9ff',
    background: '#0a0f1a',
    card: '#101828',
    text: '#e5e7eb',
  })

  const settingsChanged =
    JSON.stringify({
      ...settings,
      custom_theme: customTheme,
    }) !==
    JSON.stringify({
      ...originalSettings,
      custom_theme: originalSettings.custom_theme,
    })

  const [editingProjects, setEditingProjects] = useState({})
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  const [previewImages, setPreviewImages] = useState({})
  const [selectedFiles, setSelectedFiles] = useState({})
  const [croppingImage, setCroppingImage] = useState({})

  const [newProject, setNewProject] = useState({
    title: '',
    slug: '',
    short_description: '',
  })

  const [projectLang, setProjectLang] = useState('en')
  const projectsLang = projectLang ?? lang

  function cleanUsername(value) {
    return value.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  }

  function cleanSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
  }

  function cleanProjectSlug(value) {
    return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function checkUsernameAvailability(value) {
    if (!value || value.length < 3) {
      setUsernameStatus(null)
      return
    }

    if (value === data.username) {
      setUsernameStatus('same')
      return
    }

    setUsernameStatus('checking')

    const { data: existing, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value)
      .maybeSingle()

    if (error) {
      console.error('Username check failed:', error)
      setUsernameStatus(null)
      return
    }

    setUsernameStatus(existing ? 'taken' : 'available')
  }

  async function checkSlugAvailability(value) {
    if (!value || value.length < 3) {
      setSlugStatus(null)
      return
    }

    if (value === data.slug) {
      setSlugStatus('same')
      return
    }

    setSlugStatus('checking')

    const { data: existing, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', value)
      .maybeSingle()

    if (error) {
      console.error('Slug check failed:', error)
      setSlugStatus(null)
      return
    }

    setSlugStatus(existing ? 'taken' : 'available')
  }

  function handleUsernameChange(e) {
    const cleaned = cleanUsername(e.target.value)
    setUsername(cleaned)

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current)

    usernameDebounceRef.current = setTimeout(() => {
      checkUsernameAvailability(cleaned)
    }, 500)
  }

  function handleSlugChange(e) {
    const cleaned = cleanSlug(e.target.value)
    setSlugValue(cleaned)

    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)

    slugDebounceRef.current = setTimeout(() => {
      checkSlugAvailability(cleaned)
    }, 500)
  }

  useEffect(() => {
    if (loadingSession) return
    if (!session) navigate('/login', { replace: true })
  }, [session, loadingSession, navigate])

  useEffect(() => {
    if (session) {
      ;(async () => {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Failed to fetch UID:', error)
        } else {
          console.log('🆔 My UID:', data?.user?.id)
        }
      })()
    }
  }, [session])

  useEffect(() => {
    const root = document.documentElement

    root.setAttribute('data-theme', settings.defaultTheme ?? 'dark')

    if (settings.defaultTheme === 'custom' && customTheme) {
      root.style.setProperty('--custom-brand', customTheme.brand)
      root.style.setProperty('--custom-bg', customTheme.background)
      root.style.setProperty('--custom-card', customTheme.card)
      root.style.setProperty('--custom-text', customTheme.text)
    }
  }, [settings.defaultTheme, customTheme])

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setLoadingSession(false)
    })

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingSession(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return

    ;(async () => {
      try {
        setLoading(true)

        const profile = await getMyProfile()

        if (!profile) {
          navigate('/login', { replace: true })
          return
        }

        if (!profile.slug) {
          navigate('/onboarding', { replace: true })
          return
        }

        if (slugFromUrl !== profile.slug) {
          navigate(`/${profile.slug}/edit`, { replace: true })
          return
        }

        setData(profile)
        setUsername(profile.username || '')
        setSlugValue(profile.slug || '')
      } catch (e) {
        console.error('load profile failed', e)
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    })()
  }, [session, slugFromUrl, navigate])

  useEffect(() => {
    if (!session || !slugFromUrl) {
      setLoadingSettings(false)
      return
    }

    ;(async () => {
      try {
        setLoadingSettings(true)

        const remote = await getSettings(slugFromUrl)
        const loaded = remote || DEFAULT_SETTINGS

        setSettings(loaded)
        setOriginalSettings({
          ...loaded,
          custom_theme: loaded.custom_theme,
        })

        if (loaded.custom_theme) {
          setCustomTheme(loaded.custom_theme)
        }
      } catch (err) {
        console.error('settings load failed', err)
        setSettings(DEFAULT_SETTINGS)
      } finally {
        setLoadingSettings(false)
      }
    })()
  }, [session, slugFromUrl])

  useEffect(() => {
    if (session) {
      getMyProjects()
    }
  }, [session])

  useEffect(() => {
    return () => {
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current)
      if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
    }
  }, [])

  useEffect(() => {
    setProjectLang(lang)
  }, [lang])

  useEffect(() => {
    setData((prev) => {
      if (!prev) return prev

      let changed = false
      const next = { ...prev }

      ;['name', 'title', 'about', 'phoneLabel', 'phone2Label'].forEach((k) => {
        const en = `${k}_en`
        const ar = `${k}_ar`

        if (!next[en] && next[k]) {
          next[en] = next[k]
          changed = true
        }
        if (!next[ar] && next[k]) {
          next[ar] = next[k]
          changed = true
        }
      })

      return changed ? next : prev
    })
  }, [])

  function setSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function saveSettings(e) {
    e?.preventDefault?.()

    try {
      setSavingSettings(true)

      await updateSettings({
        ...settings,
        custom_theme: customTheme,
      })

      setOriginalSettings({
        ...settings,
        custom_theme: customTheme,
      })

      alert('Settings saved ✅')
    } catch (e) {
      console.error(e)
      alert('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  async function getMyProjects() {
    try {
      setLoadingProjects(true)

      const { data: userData } = await supabase.auth.getUser()
      const uid = userData?.user?.id

      if (!uid) return

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', uid)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProjects(data || [])
    } catch (err) {
      console.error('load projects failed', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  async function createProject() {
    if (!newProject.title.trim() || !newProject.slug.trim()) {
      alert('Title & slug required')
      return
    }

    const exists = projects.find((p) => p.slug === newProject.slug)
    if (exists) {
      alert('Slug already exists')
      return
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const uid = userData?.user?.id
      if (!uid) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            owner_id: uid,
            title: newProject.title.trim(),
            slug: newProject.slug.trim(),
            short_description: newProject.short_description?.trim() || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setProjects((prev) => [data, ...prev])

      setNewProject({
        title: '',
        slug: '',
        short_description: '',
      })

      alert('Project created ✅')
    } catch (err) {
      console.error('Create project failed:', err)

      if (err.message?.includes('unique')) {
        alert('Slug already exists')
      } else {
        alert('Failed to create project')
      }
    }
  }

  async function uploadCover(file, project) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData?.user?.id
      if (!uid) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}/${project.slug}/cover.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('projects').upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('projects').getPublicUrl(filePath)
      const publicUrl = data.publicUrl + `?t=${Date.now()}`

      const { error: dbError } = await supabase
        .from('projects')
        .update({ cover_image: publicUrl })
        .eq('id', project.id)

      if (dbError) throw dbError

      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, cover_image: publicUrl } : p))
      )

      alert('Cover uploaded ✅')
    } catch (err) {
      console.error('Upload cover failed:', err)
      alert('Failed to upload cover')
    }
  }

  async function uploadGallery(files, project) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData?.user?.id
      if (!uid) throw new Error('User not authenticated')

      const uploadedUrls = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${uid}/${project.slug}/${fileName}`

        const { error } = await supabase.storage.from('projects').upload(filePath, file, {
          contentType: file.type,
        })

        if (error) throw error

        const { data } = supabase.storage.from('projects').getPublicUrl(filePath)
        uploadedUrls.push(data.publicUrl)
      }

      const { data: currentProject } = await supabase
        .from('projects')
        .select('gallery')
        .eq('id', project.id)
        .single()

      const updatedGallery = [...(currentProject?.gallery || []), ...uploadedUrls]

      const { error: dbError } = await supabase
        .from('projects')
        .update({ gallery: updatedGallery })
        .eq('id', project.id)

      if (dbError) throw dbError

      alert('Gallery updated ✅')

      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, gallery: updatedGallery } : p))
      )
    } catch (err) {
      console.error('Gallery upload failed:', err)
      alert('Failed to upload gallery')
    }
  }

  async function deleteGalleryImage(project, imageUrl) {
    try {
      const url = new URL(imageUrl)
      const filePath = url.pathname.split('/projects/')[1]

      await supabase.storage.from('projects').remove([filePath])

      const updatedGallery = project.gallery.filter((url) => url !== imageUrl)

      await supabase.from('projects').update({ gallery: updatedGallery }).eq('id', project.id)

      alert('Image deleted ✅')

      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, gallery: updatedGallery } : p))
      )
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  async function updateProject(projectId, values) {
    try {
      const { error } = await supabase.from('projects').update(values).eq('id', projectId)
      if (error) throw error

      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...values } : p)))
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  async function moveImage(project, imageUrl, direction) {
    const gallery = [...project.gallery]
    const index = gallery.indexOf(imageUrl)
    const newIndex = index + direction

    if (newIndex < 0 || newIndex >= gallery.length) return

    ;[gallery[index], gallery[newIndex]] = [gallery[newIndex], gallery[index]]

    await supabase.from('projects').update({ gallery }).eq('id', project.id)

    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, gallery } : p)))
  }

  const bind = (key) => ({
    dir: editLang === 'ar' ? 'rtl' : 'ltr',
    value: (editLang === 'ar' ? data[`${key}_ar`] : data[`${key}_en`]) ?? data[key] ?? '',
    onChange: (e) => {
      const k = editLang === 'ar' ? `${key}_ar` : `${key}_en`
      setData((prev) => ({ ...prev, [k]: e.target.value }))
    },
  })

  function onChange(e) {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  function onChangeSocial(e) {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      socials: { ...(prev.socials || {}), [name]: value },
    }))
  }

  function onPdfUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('PDF فقط')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('الحد 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => setData((prev) => ({ ...prev, cv: ev.target.result }))
    reader.readAsDataURL(file)
  }

  function removePdf() {
    setData((prev) => ({ ...prev, cv: '' }))
  }

  async function onSave(e) {
    e.preventDefault()

    if (!username || !slugValue) {
      alert('Please choose username and slug first')
      return
    }

    if (!data.username && usernameStatus !== 'available') {
      alert('Please choose an available username')
      return
    }

    if (!data.slug && slugStatus !== 'available') {
      alert('Please choose an available slug')
      return
    }

    try {
      setSaving(true)

      const isFirstTime = !data.slug && username

      await upsertProfile({
        ...data,
        username,
        slug: slugValue,
      })

      setData((prev) => ({
        ...prev,
        username,
        slug: slugValue,
      }))

      alert(t.saved)

      if (isFirstTime) {
        navigate(`/${slugValue}`)
      }
    } catch (err) {
      if (err.message?.includes('duplicate')) {
        setUsernameStatus('taken')
        alert('Username already taken')
        return
      }

      console.error(err)
      alert('فشل الحفظ — حاول تاني')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    try {
      await signOut()
    } catch (e) {
      console.error(e)
    }
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm opacity-80">Loading…</div>
      </div>
    )
  }

  if (loading) {
    return (
      <section className="card p-6">
        <h2 className="text-xl font-bold mb-2">Edit Profile</h2>
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <>
      <div className="flex justify-center mb-6">
        <div
          className="flex rounded-full backdrop-blur p-1"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          {[
            ['profile', lang === 'ar' ? 'إدارة الملف الشخصي' : 'Profile Management'],
            ['settings', lang === 'ar' ? 'الإعدادات' : 'Settings'],
            ['projects', lang === 'ar' ? 'إدارة المشاريع' : 'Project Management'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
                activeTab === key
                  ? 'bg-[var(--brand)] text-[var(--brand-contrast)] shadow-lg'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <ProfileManagement
          lang={lang}
          t={t}
          data={data}
          setData={setData}
          saving={saving}
          onSave={onSave}
          onChange={onChange}
          onChangeSocial={onChangeSocial}
          bind={bind}
          editLang={editLang}
          setEditLang={setEditLang}
          username={username}
          slugValue={slugValue}
          usernameStatus={usernameStatus}
          slugStatus={slugStatus}
          handleUsernameChange={handleUsernameChange}
          handleSlugChange={handleSlugChange}
          removePdf={removePdf}
          onPdfUpload={onPdfUpload}
          profileCropping={profileCropping}
          setProfileCropping={setProfileCropping}
          onLogout={handleLogout}
        />
      )}

      {activeTab === 'settings' && (
        <Settings
          lang={lang}
          settings={settings}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          loadingSettings={loadingSettings}
          savingSettings={savingSettings}
          settingsChanged={settingsChanged}
          saveSettings={saveSettings}
          setSetting={setSetting}
          customTheme={customTheme}
          setCustomTheme={setCustomTheme}
        />
      )}

      {activeTab === 'projects' && (
        <ProjectManagement
          lang={lang}
          projectLang={projectLang}
          setProjectLang={setProjectLang}
          projectsLang={projectsLang}
          newProject={newProject}
          setNewProject={setNewProject}
          cleanProjectSlug={cleanProjectSlug}
          createProject={createProject}
          loadingProjects={loadingProjects}
          projects={projects}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          editingProjects={editingProjects}
          setEditingProjects={setEditingProjects}
          updateProject={updateProject}
          croppingImage={croppingImage}
          setCroppingImage={setCroppingImage}
          uploadCover={uploadCover}
          previewImages={previewImages}
          setPreviewImages={setPreviewImages}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          uploadGallery={uploadGallery}
          moveImage={moveImage}
          deleteGalleryImage={deleteGalleryImage}
        />
      )}
    </>
  )
}
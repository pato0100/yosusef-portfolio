import { useEffect, useState, useRef, useMemo } from 'react'
import defaults from '../data/defaultProfile.json'
import { getProfile, upsertProfile, getMyProfile } from '../services/cloudStorage'
import { useI18n } from '../i18n/i18n'
import { supabase, signOut, getSession, onAuthChange } from '../lib/supabase'
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '../services/settings'
import { THEME_OPTIONS } from '../data/themes'
import { useNavigate, useParams } from 'react-router-dom'
import CoverCropper from '../components/CoverCropper'
import ProfileCropper from "../components/ProfileCropper"



function ThemeSelector({ value, onChange }) {

return (

<div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">

{THEME_OPTIONS.map(theme => {

const active = value === theme.value

return (

<button
key={theme.value}
type="button"
onClick={()=>onChange(theme.value)}
className={`rounded-xl border p-3 text-left transition hover:scale-[1.02] ${
active ? 'ring-2 ring-[var(--brand)]' : ''
}`}
style={{
background:"var(--card)",
borderColor:"var(--card-border)"
}}
>

<div className="flex items-center gap-2 mb-2">

<span className="text-lg">
{theme.icon || '🎨'}
</span>

<span className="text-sm font-medium">
{theme.label}
</span>

</div>

{/* Theme preview */}
<div className="flex gap-1">

<div className="w-4 h-4 rounded"
style={{background:theme.preview?.[0] || '#00bcd4'}} />

<div className="w-4 h-4 rounded"
style={{background:theme.preview?.[1] || '#222'}} />

<div className="w-4 h-4 rounded"
style={{background:theme.preview?.[2] || '#fff'}} />

</div>

</button>

)

})}

</div>

)

}


export default function Edit() {
  
  const [activeTab, setActiveTab] = useState('profile')
// profile | settings | projects

const [editingProjects, setEditingProjects] = useState({})

  const { t, lang } = useI18n()

  
    // 🧩 إعدادات الموقع (Settings)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [settingsTab, setSettingsTab] = useState('general')
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [originalSettings, setOriginalSettings] = useState(DEFAULT_SETTINGS)

const settingsChanged =
  JSON.stringify(settings) !== JSON.stringify(originalSettings)



  // ✅ حالة الجلسة الفعلية من Supabase
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // ✅ بيانات الفورم
  const [data, setData] = useState(defaults)

const [profileCropping, setProfileCropping] = useState(null)
  
// ===== Projects State =====
const [activeProjectId, setActiveProjectId] = useState(null)
const [projects, setProjects] = useState([])
const [loadingProjects, setLoadingProjects] = useState(false)

// 🔥 Gallery preview لكل مشروع
const [previewImages, setPreviewImages] = useState({})   // { [projectId]: [urls] }
const [selectedFiles, setSelectedFiles] = useState({})   // { [projectId]: [File] }

// 🔥 Cover crop
const [croppingImage, setCroppingImage] = useState({}) // { [projectId]: base64 }

// ➕ New project
const [newProject, setNewProject] = useState({
  title: '',
  slug: '',
  short_description: ''
})

  // ================= Username / Slug =================
const navigate = useNavigate()
const { slug: slugFromUrl } = useParams()

const [username, setUsername] = useState('')
const [usernameStatus, setUsernameStatus] = useState(null)
// null | checking | available | taken | same

const debounceRef = useRef(null)

function cleanUsername(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function cleanProjectSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function ToggleSwitch({value,onChange}){

return(

<button
onClick={onChange}
className="relative w-12 h-6 rounded-full transition duration-300"
style={{
background:value
? "var(--brand)"
: "var(--card-border)",
boxShadow:value
? "0 0 8px var(--brand)"
: "none"
}}
>

<span
className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition duration-300"
style={{
transform:value
? "translateX(24px)"
: "translateX(0)"
}}
/>

</button>

)

}

async function checkUsernameAvailability(value) {
  if (!value || value.length < 3) {
    setUsernameStatus(null)
    return
  }

  if (value === data.slug) {
    setUsernameStatus('same')
    return
  }

  setUsernameStatus('checking')

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', value)
    .maybeSingle()

  if (!existing) setUsernameStatus('available')
  else setUsernameStatus('taken')
}

function handleUsernameChange(e) {
  const cleaned = cleanUsername(e.target.value)
  setUsername(cleaned)

  if (debounceRef.current) {
    clearTimeout(debounceRef.current)
  }

  debounceRef.current = setTimeout(() => {
    checkUsernameAvailability(cleaned)
  }, 500)
}


  // ✅ حالة تحميل/حفظ لواجهة أحسن
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
// Debug: Show current UID in console
useEffect(() => {
  if (session) {
    (async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Failed to fetch UID:', error)
      } else {
        console.log('🆔 My UID:', data?.user?.id)
      }
    })()
  }
}, [session])




  // اتجاه الواجهة
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  useEffect(() => {
    document.documentElement.setAttribute('dir', dir)
  }, [dir])

  // جلب حالة الجلسة ومتابعة تغيّرها
  useEffect(() => {
    let unsubscribe
    (async () => {
      const current = await getSession()
      setSession(current)
      setLoadingSession(false)
      const { data: sub } = onAuthChange((sess) => setSession(sess))
      unsubscribe = sub.subscription.unsubscribe
    })()
    return () => { if (unsubscribe) unsubscribe() }
  }, [])

  // ⬇️ جلب البيانات من Supabase أول ما الصفحة تتفتح بعد ما المستخدم يتوثّق
useEffect(() => {
  if (!session) return

  (async () => {
    try {
      setLoading(true)

      const remote = await getMyProfile()
      const profile = remote || defaults

      setData(profile)
      setUsername(profile?.slug || '')

    } catch (e) {
      console.error('load profile failed', e)
      setData(defaults)
    } finally {
      setLoading(false)
    }
  })()

}, [session])

  // ⬇️ جلب الإعدادات من Supabase بعد تسجيل الدخول
useEffect(() => {
  if (!session) return

  (async () => {
    try {
      setLoading(true)

      const remote = await getMyProfile()
      const profile = remote || null

      // ❌ مش مسجل دخول
      if (!profile) {
        navigate('/login', { replace: true })
        return
      }

      // ❌ معندوش slug
      if (!profile.slug) {
        navigate('/onboarding', { replace: true })
        return
      }

      // ❌ slug في الرابط مش مطابق
      if (slugFromUrl !== profile.slug) {
        navigate(`/${profile.slug}/edit`, { replace: true })
        return
      }

      // ✅ كل حاجة تمام
      setData(profile)
      setUsername(profile.slug)

    } catch (e) {
      console.error('load profile failed', e)
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  })()

}, [session, slugFromUrl])

useEffect(() => {
  if (!session || !slugFromUrl) {
    setLoadingSettings(false)
    return
  }

  (async () => {
    try {
      setLoadingSettings(true)

      const remote = await getSettings(slugFromUrl)

      const loaded = remote || DEFAULT_SETTINGS

      setSettings(loaded)
      setOriginalSettings(loaded)

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
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }
}, [])

  // مهاجرة بيانات قديمة → نملأ *_en/*_ar من القيمة القديمة مرة واحدة
  useEffect(() => {
    setData((prev) => {
      if (!prev) return prev
      let changed = false
      const next = { ...prev }
      ;['name', 'title', 'about', 'phoneLabel', 'phone2Label'].forEach((k) => {
        const en = `${k}_en`, ar = `${k}_ar`
        if (!next[en] && next[k]) { next[en] = next[k]; changed = true }
        if (!next[ar] && next[k]) { next[ar] = next[k]; changed = true }
      })
      return changed ? next : prev
    })
  }, [])

  // 🧩 تحديث إعداد منفرد
function setSetting(key, value) {
  setSettings(prev => ({ ...prev, [key]: value }))
}

// 🧩 حفظ كل الإعدادات في قاعدة البيانات
async function saveSettings(e) {
  e?.preventDefault?.()
  try {
    setSavingSettings(true)
    await updateSettings(settings)

setOriginalSettings(settings)

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

  // 🔒 Prevent duplicate slug (frontend check)
  const exists = projects.find(
    p => p.slug === newProject.slug
  )

  if (exists) {
    alert('Slug already exists')
    return
  }

  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser()

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
          short_description: newProject.short_description?.trim() || null
        }
      ])
      .select()
      .single()

    if (error) throw error

    // Update UI instantly
    setProjects(prev => [data, ...prev])

    setNewProject({
      title: '',
      slug: '',
      short_description: ''
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
    if (!uid) throw new Error("User not authenticated")

    const fileExt = file.name.split('.').pop()
    const filePath = `${uid}/${project.slug}/cover.${fileExt}`

    // 1️⃣ Upload (replace old)
    const { error: uploadError } = await supabase.storage
      .from('projects')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      })

    if (uploadError) throw uploadError

    // 2️⃣ Get public URL
    const { data } = supabase.storage
      .from('projects')
      .getPublicUrl(filePath)

    // 🔥 3️⃣ Cache busting
    const publicUrl = data.publicUrl + `?t=${Date.now()}`

    // 4️⃣ Update DB
    const { error: dbError } = await supabase
      .from('projects')
      .update({ cover_image: publicUrl })
      .eq('id', project.id)

    if (dbError) throw dbError

    // 5️⃣ Update local state
    setProjects(prev =>
      prev.map(p =>
        p.id === project.id
          ? { ...p, cover_image: publicUrl }
          : p
      )
    )

    alert("Cover uploaded ✅")

  } catch (err) {
    console.error("Upload cover failed:", err)
    alert("Failed to upload cover")
  }
}

async function uploadGallery(files, project) {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData?.user?.id
    if (!uid) throw new Error("User not authenticated")

    const uploadedUrls = []

    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `gallery-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`

      const filePath = `${uid}/${project.slug}/${fileName}`

      const { error } = await supabase.storage
        .from('projects')
        .upload(filePath, file, {
          contentType: file.type
        })

      if (error) throw error

      const { data } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath)

      uploadedUrls.push(data.publicUrl)
    }

    const { data: currentProject } = await supabase
  .from('projects')
  .select('gallery')
  .eq('id', project.id)
  .single()

const updatedGallery = [
  ...(currentProject?.gallery || []),
  ...uploadedUrls
]

    const { error: dbError } = await supabase
      .from('projects')
      .update({ gallery: updatedGallery })
      .eq('id', project.id)

    if (dbError) throw dbError

    alert("Gallery updated ✅")
    setProjects(prev =>
  prev.map(p =>
    p.id === project.id
      ? { ...p, gallery: updatedGallery }
      : p
  )
)


  } catch (err) {
    console.error("Gallery upload failed:", err)
    alert("Failed to upload gallery")
  }
}

async function deleteGalleryImage(project, imageUrl) {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData?.user?.id

   const url = new URL(imageUrl)
const filePath = url.pathname.split('/projects/')[1]

    await supabase.storage
      .from('projects')
      .remove([filePath])

    const updatedGallery = project.gallery.filter(
      url => url !== imageUrl
    )

    await supabase
      .from('projects')
      .update({ gallery: updatedGallery })
      .eq('id', project.id)

    alert("Image deleted ✅")
    setProjects(prev =>
  prev.map(p =>
    p.id === project.id
      ? { ...p, gallery: updatedGallery }
      : p
  )
)


  } catch (err) {
    console.error("Delete failed:", err)
  }
}

async function updateProject(projectId, values) {
  try {
    const { error } = await supabase
      .from('projects')
      .update(values)
      .eq('id', projectId)

    if (error) throw error

    // 🔥 Update locally instead of reload
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, ...values }
          : p
      )
    )

  } catch (err) {
    console.error("Update failed:", err)
  }
}

async function moveImage(project, imageUrl, direction) {
  const gallery = [...project.gallery]

  const index = gallery.indexOf(imageUrl)
  const newIndex = index + direction

  if (newIndex < 0 || newIndex >= gallery.length) return

  // Swap
  ;[gallery[index], gallery[newIndex]] =
    [gallery[newIndex], gallery[index]]

  await supabase
    .from('projects')
    .update({ gallery })
    .eq('id', project.id)

  setProjects(prev =>
  prev.map(p =>
    p.id === project.id
      ? { ...p, gallery }
      : p
  )
)

}


  // bind helper لحقول ثنائية اللغة
  const [editLang, setEditLang] = useState('en') // 'en' | 'ar'
  const [projectLang, setProjectLang] = useState('en')
  useEffect(() => {
  setProjectLang(lang)
}, [lang])
  const projectsLang = projectLang ?? lang
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
    setData((prev) => ({ ...prev, socials: { ...(prev.socials || {}), [name]: value } }))
  }

  // رفع الصورة (ضغط تلقائي)
  function onImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { alert('الصورة كبيرة جدًا، أقل من 8MB'); return }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const maxDim = 640
        let { width, height } = img

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width); width = maxDim
        } else if (height > width && height > maxDim) {
          width = Math.round((width * maxDim) / height); height = maxDim
        } else if (width > maxDim) {
          height = maxDim; width = maxDim
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const compressed = file.type === 'image/png'
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', 0.82)

        setData((prev) => ({
          ...prev,
          image: compressed,
          imageUrl: prev.imageUrl || '',
        }))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  // رفع/حذف PDF
  function onPdfUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('PDF فقط'); return }
    if (file.size > 5 * 1024 * 1024) { alert('الحد 5MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setData((prev) => ({ ...prev, cv: ev.target.result }))
    reader.readAsDataURL(file)
  }
  function removePdf() { setData((prev) => ({ ...prev, cv: '' })) }

  // ✅ حفظ على Supabase بدل LocalStorage
async function onSave(e) {
  e.preventDefault()

  if (!data.slug && !username) {
    alert('Choose a username first')
    return
  }

  if (!data.slug && usernameStatus !== 'available') {
  alert('Please choose an available username')
  return
}

  try {
    setSaving(true)

    const isFirstTime = !data.slug && username

    await upsertProfile({
  ...data,
  slug: username
})




// 🔥 مهم جدًا
setData(prev => ({
  ...prev,
  slug: username
}))

    alert(t.saved)

    if (isFirstTime) {
      navigate(`/${username}`)
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


  // حالة تحميل الجلسة
   // حالة تحميل الجلسة
  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm opacity-80">Loading…</div>
      </div>
    )
  }



  // غير موثّق → اعرض واجهة تسجيل الدخول
  if (!session) {
    return <LoginCard />
  }


  // موثّق → اعرض لوحة التعديل
  if (loading) {
    return (
      <section className="card p-6">
        <h2 className="text-xl font-bold mb-2">Edit Profile</h2>
        <p>Loading...</p>
      </section>
    )
  }


  
  // =======================
  //   RETURN (مصبوط)
  // =======================
  return (
    <>
    {/* ===== Dashboard Tabs ===== */}
<div className="flex justify-center mb-6">
  <div className="flex rounded-full border border-white/10 bg-white/5 backdrop-blur p-1">

    {[
  [
    'profile',
    lang === 'ar' ? 'إدارة الملف الشخصي' : 'Profile Management'
  ],
  [
    'settings',
    lang === 'ar' ? 'الإعدادات' : 'Settings'
  ],
  [
    'projects',
    lang === 'ar' ? 'إدارة المشاريع' : 'Project Management'
  ]
].map(([key, label]) => (
      <button
        key={key}
        onClick={() => setActiveTab(key)}
        className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
          activeTab === key
            ? 'bg-[var(--brand)] text-[var(--brand-contrast)] shadow-lg'
            : 'text-white/70 hover:text-white'
        }`}
      >
        {label}
      </button>
    ))}

  </div>
</div>
      {/* ===== Edit Profile ===== */}
      {activeTab === 'profile' && (
  <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button
            onClick={async () => { try { await signOut() } catch(e){ console.error(e) } }}
            className="px-3 py-2 rounded-xl border border-white/15 hover:bg-white/5"
          >
            
            Logout
          </button>
        </div>
        

        <form onSubmit={onSave} className="grid md:grid-cols-2 gap-4">
          {/* سويتش لغة المحتوى داخل صفحة التعديل */}
          <div className="md:col-span-2 flex items-center gap-2 mb-1">
            <span className="text-sm opacity-70">Content language:</span>
            <div className="inline-flex rounded-full border border-[var(--card-border)] overflow-hidden">
              <button type="button" onClick={() => setEditLang('en')} className={`px-3 py-1 text-sm ${editLang === 'en' ? 'bg-[var(--brand)] text-[var(--brand-contrast)]' : ''}`}>EN</button>
              <button type="button" onClick={() => setEditLang('ar')} className={`px-3 py-1 text-sm ${editLang === 'ar' ? 'bg-[var(--brand)] text-[var(--brand-contrast)]' : ''}`}>AR</button>
            </div>
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium mb-1">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
            <input id="email" name="email" type="email" className="input" placeholder={lang === 'ar' ? 'name@example.com' : 'name@example.com'} value={data.email || ''} onChange={onChange} inputMode="email" autoComplete="email" />
            <p className="mt-1 text-xs opacity-70">{lang === 'ar' ? 'سنستخدمه لزر “إرسال بريد” في صفحة البروفايل.' : 'Used for the “Send Email” button on your profile.'}</p>
          </div>

         {/* Username / Slug */}
<div className="md:col-span-2">
  <label className="block text-sm font-medium mb-1">
    Username (Profile URL)
  </label>

  <input
    type="text"
    value={username}
    onChange={handleUsernameChange}
    disabled={!!data.slug}
    className="input"
    placeholder="your-username"
  />

  {usernameStatus === 'checking' && (
    <p className="text-xs opacity-60 mt-1">Checking...</p>
  )}

  {usernameStatus === 'available' && (
    <p className="text-xs text-green-500 mt-1">Available ✅</p>
  )}

  {usernameStatus === 'taken' && (
    <p className="text-xs text-red-500 mt-1">Already taken ❌</p>
  )}

  {data.slug && (
    <p className="text-xs opacity-60 mt-1">
      Username locked after first save.
    </p>
  )}
</div>

          {/* حقول ثنائية اللغة */}
          <input className="input" {...bind('name')}  placeholder={editLang === 'ar' ? 'الاسم' : 'Name'} />
          <input className="input" {...bind('title')} placeholder={editLang === 'ar' ? 'المسمى الوظيفي' : 'Title'} />
          <textarea className="input md:col-span-2" {...bind('about')} placeholder={editLang === 'ar' ? 'نبذة' : 'About'} />

          {/* أرقام + تسميات */}
          <input className="input" name="phone"  value={data.phone || ''}  onChange={onChange} placeholder="Phone (+20...)" />
          <input className="input" {...bind('phoneLabel')} placeholder={editLang === 'ar' ? 'اسم رقم الهاتف (مثلاً: الشخصي)' : 'Phone label (e.g. Personal)'} />
          <input className="input" name="phone2" value={data.phone2 || ''} onChange={onChange} placeholder="Second Phone (+20...)" />
          <input className="input" {...bind('phone2Label')} placeholder={editLang === 'ar' ? 'اسم الرقم الثاني (مثلاً: العمل)' : 'Second phone label (e.g. Work)'} />
          <input className="input" name="whatsapp" value={data.whatsapp || ''} onChange={onChange} placeholder="WhatsApp (+20...)" />

          {/* صورة البروفايل */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-medium">Profile Picture</label>
            {data.image && <img src={data.image} alt="Profile preview" className="w-24 h-24 object-cover rounded-full border border-gray-300 shadow" />}
           <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      alert('الصورة كبيرة جدًا، أقل من 8MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setProfileCropping(ev.target.result)
    }
    reader.readAsDataURL(file)
  }}
  className="input cursor-pointer"
/>
          </div>

          {/* سوشيال */}
          <div className="md:col-span-2 grid md:grid-cols-2 gap-3">
            <input className="input" name="facebook"  value={data.socials?.facebook  || ''} onChange={onChangeSocial} placeholder="Facebook URL" />
            <input className="input" name="instagram" value={data.socials?.instagram || ''} onChange={onChangeSocial} placeholder="Instagram URL" />
            <input className="input" name="x"        value={data.socials?.x        || ''} onChange={onChangeSocial} placeholder="X (Twitter) URL" />
            <input className="input" name="linkedin" value={data.socials?.linkedin || ''} onChange={onChangeSocial} placeholder="LinkedIn URL" />
            <input className="input" name="youtube"  value={data.socials?.youtube  || ''} onChange={onChangeSocial} placeholder="YouTube URL" />
            <input className="input" name="tiktok"   value={data.socials?.tiktok   || ''} onChange={onChangeSocial} placeholder="TikTok URL" />
            <input className="input md:col-span-2" name="github" value={data.socials?.github || ''} onChange={onChangeSocial} placeholder="GitHub URL" />
          </div>

          {/* CV */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-medium">{lang === 'ar' ? 'السيرة الذاتية (PDF)' : 'CV (PDF)'}</label>
            {data.cv ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm opacity-80">{lang === 'ar' ? 'ملف PDF مرفوع' : 'PDF attached'}</span>
                <a href={data.cv} target="_blank" rel="noreferrer" className="btn btn-outline">{lang === 'ar' ? 'معاينة' : 'Preview'}</a>
                <button type="button" onClick={removePdf} className="btn btn-ghost">{lang === 'ar' ? 'حذف' : 'Remove'}</button>
              </div>
            ) : (
              <>
                <input type="file" accept="application/pdf" onChange={onPdfUpload} className="input cursor-pointer" />
                <p className="text-xs opacity-70">{lang === 'ar' ? 'ارفع ملف PDF بحجم أقل من 5MB' : 'Upload a PDF under 5MB'}</p>
              </>
            )}
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : t.save}</button>
          </div>
            </form>

  </section>
)}

      {profileCropping && (
  <ProfileCropper
    image={profileCropping}
    onCancel={() => setProfileCropping(null)}
    onConfirm={(croppedBase64) => {

      // 👇 هنا هنستخدم نفس منطق الضغط القديم
      const img = new Image()

      img.onload = () => {
        const maxDim = 640
        let { width, height } = img

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else if (height > width && height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        } else if (width > maxDim) {
          height = maxDim
          width = maxDim
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const compressed = canvas.toDataURL('image/jpeg', 0.82)

        setData(prev => ({
          ...prev,
          image: compressed,
          imageUrl: prev.imageUrl || ''
        }))

        setProfileCropping(null)
      }

      img.src = croppedBase64
    }}
  />
)}


{/* ===== Settings Panel ===== */}
{activeTab === 'settings' && (
<section className="card p-6">

{/* Header */}
<div className="flex items-center justify-between mb-6">
<h2 className="text-lg font-bold">
{lang === 'ar' ? 'الإعدادات' : 'Settings'}
</h2>

<button
onClick={saveSettings}
disabled={savingSettings || loadingSettings || !settingsChanged}
className="btn btn-primary"
>
{savingSettings
? (lang === 'ar' ? 'جارٍ الحفظ…' : 'Saving…')
: (lang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
</button>
</div>

{loadingSettings ? (
<div className="opacity-70">Loading settings…</div>
) : (

<>
{/* ===== SETTINGS TABS ===== */}

<div className="flex gap-2 mb-8 flex-wrap">

{[
['general', lang === 'ar' ? 'عام' : 'General'],
['pages', lang === 'ar' ? 'الصفحات' : 'Pages'],
['profile', lang === 'ar' ? 'الملف الشخصي' : 'Profile'],
['downloads', lang === 'ar' ? 'التحميلات' : 'Downloads']
].map(([key,label]) => (

<button
key={key}
onClick={()=>setSettingsTab(key)}
className={`px-4 py-1.5 rounded-lg text-sm transition ${
settingsTab===key
? 'bg-[var(--brand)] text-[var(--brand-contrast)]'
: 'border'
}`}
style={{
borderColor:"var(--card-border)"
}}
>
{label}
</button>

))}

</div>

{/* ===== GENERAL TAB ===== */}

{settingsTab === 'general' && (

<div className="grid md:grid-cols-2 gap-4">

{/* Language */}
<div
className="rounded-xl p-4 border hover:shadow-md transition"
style={{
background:"var(--card)",
borderColor:"var(--card-border)"
}}
>

<label className="block text-sm font-medium mb-2">
{lang === 'ar' ? 'اللغة الافتراضية' : 'Default Language'}
</label>

<select
className="input"
value={settings.defaultLang}
onChange={(e)=>setSetting('defaultLang',e.target.value)}
>
<option value="ar">Arabic</option>
<option value="en">English</option>
</select>

</div>

{/* Theme */}
<div
className="rounded-xl p-4 border hover:shadow-md transition"
style={{
background:"var(--card)",
borderColor:"var(--card-border)"
}}
>

<label className="block text-sm font-medium mb-2">
{lang === 'ar' ? 'الثيم الافتراضي' : 'Default Theme'}
</label>

<ThemeSelector
value={settings.defaultTheme}
onChange={(v)=>setSetting('defaultTheme',v)}
/>

</div>

</div>

)}

{/* ===== PAGES TAB ===== */}

{settingsTab === 'pages' && (

<div className="grid md:grid-cols-2 gap-4">

{[
['showContactPage','Contact Page','📞'],
['showProjectsPage','Projects Page','📁']
].map(([key,label,icon])=>(

<div
key={key}
className="rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition"
style={{
background:"var(--card)",
borderColor:"var(--card-border)"
}}
>

<div className="flex items-center gap-3">

<div
className="w-9 h-9 rounded-lg flex items-center justify-center"
style={{
background:"var(--brand)",
color:"var(--brand-contrast)"
}}
>
{icon}
</div>

<div className="text-sm font-medium">
{label}
</div>

</div>

<ToggleSwitch
value={settings[key]}
onChange={()=>setSetting(key,!settings[key])}
/>

</div>

))}

</div>

)}

{/* ===== PROFILE TAB ===== */}

{settingsTab === 'profile' && (

<div className="grid md:grid-cols-2 gap-4">

{[
['showQR','QR Code','🔳'],
['showSocials','Social Links','🌐']
].map(([key,label,icon])=>(

<div
key={key}
className="rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition"
style={{
background:"var(--card)",
borderColor:"var(--card-border)"
}}
>

<div className="flex items-center gap-3">

<div
className="w-9 h-9 rounded-lg flex items-center justify-center"
style={{
background:"var(--brand)",
color:"var(--brand-contrast)"
}}
>
{icon}
</div>

<div className="text-sm font-medium">
{label}
</div>

</div>

<ToggleSwitch
value={settings[key]}
onChange={()=>setSetting(key,!settings[key])}
/>

</div>

))}

</div>

)}

{/* ===== DOWNLOADS TAB ===== */}

{settingsTab === 'downloads' && (

<div className="grid md:grid-cols-2 gap-4">

{[
['showDownloadCV','Download CV','📄'],
['showDownloadVcard','Download vCard','👤']
].map(([key,label,icon])=>(

<div
key={key}
className="rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition"
style={{
background:"var(--card)",
borderColor:"var(--card-border)"
}}
>

<div className="flex items-center gap-3">

<div
className="w-9 h-9 rounded-lg flex items-center justify-center"
style={{
background:"var(--brand)",
color:"var(--brand-contrast)"
}}
>
{icon}
</div>

<div className="text-sm font-medium">
{label}
</div>

</div>

<ToggleSwitch
value={settings[key]}
onChange={()=>setSetting(key,!settings[key])}
/>

</div>

))}

</div>

)}

</>

)}

</section>
)}

     

{activeTab === 'projects' && (
  <section
  className={`card p-6 ${
    projectLang === 'ar' ? 'text-right' : 'text-left'
  }`}
  dir={projectLang === 'ar' ? 'rtl' : 'ltr'}
>
  <h2 className="text-lg font-bold mb-4">
  {projectsLang === 'ar'
  ? 'إدارة المشاريع'
  : 'Project Management'}
</h2>

<div className="flex items-center gap-2 mb-4">
  <span className="text-sm opacity-70">
   {projectsLang === 'ar'
  ? 'لغة محتوى المشروع:'
  : 'Project content:'}
</span>

  <div className="inline-flex rounded-full border border-[var(--card-border)] overflow-hidden">
    <button
      type="button"
      onClick={() => setProjectLang('en')}
      className={`px-3 py-1 text-sm ${
        projectLang === 'en'
          ? 'bg-[var(--brand)] text-[var(--brand-contrast)]'
          : ''
      }`}
    >
      EN
    </button>

    <button
      type="button"
      onClick={() => setProjectLang('ar')}
      className={`px-3 py-1 text-sm ${
        projectLang === 'ar'
          ? 'bg-[var(--brand)] text-[var(--brand-contrast)]'
          : ''
      }`}
    >
      AR
    </button>
  </div>
</div>

  {/* Add Project */}
  <div className="grid md:grid-cols-3 gap-3 mb-4">
  <input
    className="input"
    placeholder={
  projectLang === 'ar'
    ? 'عنوان المشروع'
    : 'Project title'
}
    value={newProject.title}
    onChange={(e) => {
      const title = e.target.value
      setNewProject(prev => ({
        ...prev,
        title,
        slug: cleanProjectSlug(title)
      }))
    }}
  />

  <div className="flex items-center rounded-xl border border-white/15 bg-white/5 overflow-hidden">
    <span className="px-3 text-xs opacity-60 whitespace-nowrap">
      {
  projectLang === 'ar'
    ? '/المشاريع/'
    : '/projects/'
}
    </span>
    <input
      className="bg-transparent flex-1 px-2 py-2 outline-none"
      value={newProject.slug}
      onChange={(e) =>
        setNewProject(prev => ({
          ...prev,
          slug: cleanProjectSlug(e.target.value)
        }))
      }
    />
  </div>
    <input
      className="input"
      placeholder={
  projectLang === 'ar'
    ? 'الوصف المختصر'
    : 'Short description'
}
      value={newProject.short_description}
      onChange={(e) =>
        setNewProject(prev => ({ ...prev, short_description: e.target.value }))
      }
    />
  </div>

  <button
    onClick={createProject}
    className="btn btn-primary mb-6"
  >
    {
  projectLang === 'ar'
    ? 'إضافة مشروع'
    : 'Add Project'
}
  </button>

  {/* Projects List */}
  {loadingProjects ? (
    <p>Loading projects...</p>
  ) : (
    <div className="space-y-3">
     {projects.map(project => (
  <div
    key={project.id}
    className="border border-white/10 rounded-xl p-4"
  >

    <div
      className="flex justify-between items-center cursor-pointer"
      onClick={() => {
  if (activeProjectId === project.id) {
    setActiveProjectId(null)
  } else {
    setActiveProjectId(project.id)

    setEditingProjects(prev => ({
      ...prev,
      [project.id]: { ...project }
    }))
  }
}}
    >
      <div>
        <div className="font-semibold">
  {projectLang === 'ar'
    ? project.title_ar
    : project.title_en}
</div>
        <div className="text-sm opacity-70">{project.slug}</div>
      </div>
      <div className="text-xs opacity-60">
        {activeProjectId === project.id
  ? (projectLang === 'ar' ? 'إغلاق' : 'Close')
  : (projectLang === 'ar' ? 'إدارة' : 'Manage')}
      </div>
    </div>
{activeProjectId === project.id && (
  <div className="mt-4 space-y-4">

     {/* Basic Info */}
<div className="grid md:grid-cols-2 gap-3">

  <div>
    <label className="text-sm opacity-70">
  {projectLang === 'ar' ? ' عنوان المشروع ' : ' Project Title '}
  </label>
    <input
      className="input"
    value={
  projectLang === 'ar'
    ? editingProjects[project.id]?.title_ar || ''
    : editingProjects[project.id]?.title_en || ''
}
onChange={(e) =>
  setEditingProjects(prev => ({
    ...prev,
    [project.id]: {
      ...prev[project.id],
      [projectLang === 'ar' ? 'title_ar' : 'title_en']:
        e.target.value
    }
  }))
}
dir={projectLang === 'ar' ? 'rtl' : 'ltr'}
    />
  </div>


  <div>
   <label className="text-sm opacity-70">
  {projectLang === 'ar' ? 'الوصف المختصر' : 'Short Description'}
</label>

<input
  className="input"
  dir={projectLang === 'ar' ? 'rtl' : 'ltr'}
  value={
    projectLang === 'ar'
      ? editingProjects[project.id]?.short_description_ar || ''
      : editingProjects[project.id]?.short_description_en || ''
  }
  onChange={(e) =>
    setEditingProjects(prev => ({
      ...prev,
      [project.id]: {
        ...prev[project.id],
        [projectLang === 'ar'
          ? 'short_description_ar'
          : 'short_description_en']:
          e.target.value
      }
    }))
  }
/>



  </div>

</div>


<div>
 <label className="text-sm opacity-70">
  {projectLang === 'ar' ? 'الوصف الكامل' : 'Full Description'}
</label>

<textarea
  className="input min-h-[120px]"
  dir={projectLang === 'ar' ? 'rtl' : 'ltr'}
  value={
    projectLang === 'ar'
      ? editingProjects[project.id]?.full_description_ar || ''
      : editingProjects[project.id]?.full_description_en || ''
  }
  onChange={(e) =>
    setEditingProjects(prev => ({
      ...prev,
      [project.id]: {
        ...prev[project.id],
        [projectLang === 'ar'
          ? 'full_description_ar'
          : 'full_description_en']:
          e.target.value
      }
    }))
  }
/>

</div>

{/* Tech Stack */}
<div>
  <label className="text-sm opacity-70">
    {
  projectLang === 'ar'
    ? 'التقنيات المستخدمة (افصل بفاصلة)'
    : 'Tech Stack (comma separated)'
}
  </label>

  <input
    className="input"
    value={(editingProjects[project.id]?.tech_stack || []).join(', ')}
    onChange={(e) =>
      setEditingProjects(prev => ({
        ...prev,
        [project.id]: {
          ...prev[project.id],
          tech_stack: e.target.value
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        }
      }))
    }
  />
</div>

{/* Features */}
<div>
  <label className="text-sm opacity-70">
    {
  projectLang === 'ar'
    ? 'المميزات (افصل بفاصلة)'
    : 'Features (comma separated)'
}
  </label>

  <input
    className="input"
    value={(editingProjects[project.id]?.features || []).join(', ')}
    onChange={(e) =>
      setEditingProjects(prev => ({
        ...prev,
        [project.id]: {
          ...prev[project.id],
          features: e.target.value
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        }
      }))
    }
  />
</div>

{/* URLs */}
<div className="grid md:grid-cols-2 gap-3">

  <div>
  <label className="text-sm opacity-70 block mb-1">
    {
  projectLang === 'ar'
    ? 'رابط GitHub'
    : 'GitHub URL'
}
  </label>

  <input
    type="url"
    dir="ltr"
    className="input text-left"
    value={editingProjects[project.id]?.github_url || ''}
    onChange={(e) =>
      setEditingProjects(prev => ({
        ...prev,
        [project.id]: {
          ...prev[project.id],
          github_url: e.target.value
        }
      }))
    }
    placeholder="https://github.com/username/project"
  />
</div>

  <div>
  <label className="text-sm opacity-70 block mb-1">
    {
  projectLang === 'ar'
    ? 'الرابط المباشر'
    : 'Live URL'
}
  </label>

  <input
    type="url"
    dir="ltr"
    className="input text-left"
    value={editingProjects[project.id]?.live_url || ''}
    onChange={(e) =>
      setEditingProjects(prev => ({
        ...prev,
        [project.id]: {
          ...prev[project.id],
          live_url: e.target.value
        }
      }))
    }
    placeholder="https://example.com"
  />
</div>

</div>

{/* Dates */}
<div className="grid md:grid-cols-2 gap-3">

  <div>
    <label className="text-sm opacity-70">
      {
  projectLang === 'ar'
    ? 'تاريخ البداية'
    : 'Start Date'
}
    </label>
    <input
      type="date"
      className="input"
      value={editingProjects[project.id]?.start_date || ''}
      onChange={(e) =>
        setEditingProjects(prev => ({
          ...prev,
          [project.id]: {
            ...prev[project.id],
            start_date: e.target.value
          }
        }))
      }
    />
  </div>

  <div>
    <label className="text-sm opacity-70">
      {
  projectLang === 'ar'
    ? 'تاريخ النهاية'
    : 'End Date'
}
    </label>
    <input
      type="date"
      className="input"
      value={editingProjects[project.id]?.end_date || ''}
      onChange={(e) =>
        setEditingProjects(prev => ({
          ...prev,
          [project.id]: {
            ...prev[project.id],
            end_date: e.target.value
          }
        }))
      }
    />
  </div>

</div>

{/* Publish Controls */}
<div className={`flex gap-6 ${
  projectLang === 'ar' ? 'flex-row-reverse' : ''
}`}>

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={!!editingProjects[project.id]?.is_active}
      onChange={(e) =>
        setEditingProjects(prev => ({
          ...prev,
          [project.id]: {
            ...prev[project.id],
            is_active: e.target.checked
          }
        }))
      }
    />
    {
  projectLang === 'ar'
    ? 'نشط'
    : 'Active'
}
  </label>

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={!!editingProjects[project.id]?.is_featured}
      onChange={(e) =>
        setEditingProjects(prev => ({
          ...prev,
          [project.id]: {
            ...prev[project.id],
            is_featured: e.target.checked
          }
        }))
      }
    />
    {
  projectLang === 'ar'
    ? 'مميز'
    : 'Featured'
}
  </label>

</div>

<div className="flex gap-3 mt-6">
  <button
  onClick={async () => {
    const values = { ...editingProjects[project.id] }

    delete values.id
    delete values.created_at
    delete values.updated_at
    delete values.views
    delete values.owner_id

    await updateProject(project.id, values)

    alert('Project updated ✅')
  }}
  className="btn btn-primary"
>
  {
  projectLang === 'ar'
    ? 'تحديث المشروع'
    : 'Update Project'
}
</button>

  <button
    onClick={() =>
      setEditingProjects(prev => ({
        ...prev,
        [project.id]: { ...project }
      }))
    }
    className="btn btn-ghost"
  >
    {
  projectLang === 'ar'
    ? 'إعادة تعيين'
    : 'Reset'
}
  </button>
</div>

{/* Cover Upload */}
<div>
  <label className="text-sm opacity-70">{
  projectLang === 'ar'
    ? 'رفع صورة الغلاف'
    : 'Upload Cover'
}
</label>

  {/* Upload Input */}
  <input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onChange={(e) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (ev) => {
        setCroppingImage(prev => ({
          ...prev,
          [project.id]: ev.target.result
        }))
      }
      reader.readAsDataURL(file)
    }}
  />

  {/* 🔥 Cropper Modal */}
  {croppingImage[project.id] && (
    <CoverCropper
      image={croppingImage[project.id]}
      onCancel={() =>
        setCroppingImage(prev => ({
          ...prev,
          [project.id]: null
        }))
      }
      onConfirm={async (croppedBase64) => {

        const blob = await (await fetch(croppedBase64)).blob()
        const file = new File([blob], "cover.jpg", {
          type: "image/jpeg"
        })

        await uploadCover(file, project)

        setCroppingImage(prev => ({
          ...prev,
          [project.id]: null
        }))
      }}
    />
  )}

  {/* 🟢 Existing Cover */}
  {project.cover_image && !croppingImage[project.id] && (
    <div className="mt-3 space-y-2">
      <img
        src={project.cover_image}
        className="rounded-xl h-40 object-cover border border-white/10"
      />

      <button
        onClick={() =>
          updateProject(project.id, { cover_image: null })
        }
        className="btn btn-ghost"
      >
        {
  projectLang === 'ar'
    ? 'حذف الغلاف'
    : 'Remove Cover'
}
      </button>
    </div>
  )}
</div>

        {/* Gallery Upload */}
<div>
  <label className="text-sm opacity-70">{
  projectLang === 'ar'
    ? 'رفع صور المشروع'
    : 'Upload Gallery'
}
</label>

  <input
    type="file"
    multiple
    accept="image/png,image/jpeg,image/webp"
    onChange={(e) => {
  const files = Array.from(e.target.files)

  // 🔥 خزّن الملفات لكل مشروع لوحده
  setSelectedFiles(prev => ({
    ...prev,
    [project.id]: files
  }))

  // 🔥 اعمل preview مربوط بالمشروع
  setPreviewImages(prev => ({
    ...prev,
    [project.id]: files.map(file =>
      URL.createObjectURL(file)
    )
  }))
}}
  />

  {previewImages[project.id]?.length > 0 && (
  <>
    <div className="grid grid-cols-3 gap-3 mt-3">
      {previewImages[project.id].map(src => (
        <img
          key={src}
          src={src}
          className="rounded-lg opacity-60 h-24 object-cover"
        />
      ))}
    </div>

    <div className="flex gap-3 mt-3">
      <button
        onClick={() => {
          uploadGallery(selectedFiles[project.id], project)

          setSelectedFiles(prev => ({
            ...prev,
            [project.id]: null
          }))

          setPreviewImages(prev => ({
            ...prev,
            [project.id]: null
          }))
        }}
        className="btn btn-primary"
      >
        {
  projectLang === 'ar'
    ? 'تأكيد الرفع'
    : 'Confirm Upload'
}
      </button>

      <button
        onClick={() => {
          setSelectedFiles(prev => ({
            ...prev,
            [project.id]: null
          }))
          setPreviewImages(prev => ({
            ...prev,
            [project.id]: null
          }))
        }}
        className="btn btn-ghost"
      >
        {
  projectLang === 'ar'
    ? 'إلغاء'
    : 'Cancel'
}
      </button>
    </div>
  </>
)}

</div>

        {/* Existing Gallery */}
       {project.gallery?.map(img => (
  <div key={img} className="relative group">

    <img
      src={img}
      className="rounded-lg border border-white/10"
    />

    {/* Controls */}
    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
      <button
        onClick={() => moveImage(project, img, -1)}
        className="bg-black/70 px-2 py-1 text-xs rounded"
      >
        ↑
      </button>

      <button
        onClick={() => moveImage(project, img, 1)}
        className="bg-black/70 px-2 py-1 text-xs rounded"
      >
        ↓
      </button>
    </div>

    <button
      onClick={() => deleteGalleryImage(project, img)}
      className="absolute top-2 right-2 bg-black/70 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition"
    >
      ✕
    </button>

  </div>
))}

      </div>
    )}
  </div>
))}

    </div>
  )}
  </section>
)}

    </>
  )
} // ← نهاية function Edit





function LoginCard() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

 async function signInWithGitHub() {
  try {
    setErr('')
    setLoading(true)

    const redirectTo =
      import.meta.env.DEV
        ? 'http://localhost:5173/edit'        // وقت التطوير
        : 'https://youssef-portfolio2001.vercel.app/edit';  // وقت النشر على Vercel

    await supabase.auth.signInWithOAuth({
  provider: "github",
  options: {
    redirectTo: window.location.href,
  },
})
    // بعد الدخول GitHub هيحوّلك تلقائيًا للصفحة دي تاني
  } catch (e) {
    setErr(e?.message || 'GitHub login failed')
    setLoading(false)
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-2">Admin Login</h2>
        <p className="text-sm opacity-75 mb-6">Sign in to manage your portfolio.</p>

        {err && (
          <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg p-2 mb-3">
            {err}
          </div>
        )}

        <button
          type="button"
          onClick={signInWithGitHub}
          disabled={loading}
          className="w-full rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-60"
        >
          {loading ? 'Redirecting…' : 'Sign in with GitHub'}
        </button>

        <p className="mt-4 text-xs opacity-70">
          You’ll be redirected to GitHub, then back here.
        </p>
      </div>
    </div>
  )
}


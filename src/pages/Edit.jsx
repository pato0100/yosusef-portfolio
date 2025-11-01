import { useEffect, useState } from 'react'
import defaults from '../data/defaultProfile.json'
import { getProfile, upsertProfile } from '../services/cloudStorage'
import { useI18n } from '../i18n/i18n'
import { supabase, signOut, getSession, onAuthChange } from '../lib/supabase'
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '../services/settings'
import { THEME_OPTIONS } from '../data/themes'


export default function Edit() {
  const { t, lang } = useI18n()

    // 🧩 إعدادات الموقع (Settings)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)


  // ✅ حالة الجلسة الفعلية من Supabase
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // ✅ بيانات الفورم
  const [data, setData] = useState(defaults)

  // ✅ حالة تحميل/حفظ لواجهة أحسن
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
        const remote = await getProfile()
        setData(remote || defaults)
      } catch (e) {
        console.error('load profile failed', e)
        setData(defaults)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // ⬇️ جلب الإعدادات من Supabase بعد تسجيل الدخول
useEffect(() => {
  if (!session) return
  (async () => {
    try {
      setLoadingSettings(true)
      const s = await getSettings()
      setSettings(s)
    } catch (e) {
      console.error('load settings failed', e)
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoadingSettings(false)
    }
  })()
}, [session])


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
    alert('Settings saved ✅')
  } catch (e) {
    console.error(e)
    alert('Failed to save settings')
  } finally {
    setSavingSettings(false)
  }
}


  // bind helper لحقول ثنائية اللغة
  const [editLang, setEditLang] = useState('en') // 'en' | 'ar'
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
    try {
      setSaving(true)
      await upsertProfile(data)
      alert(t.saved)
    } catch (err) {
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
      {/* ===== Edit Profile ===== */}
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
            <input type="file" accept="image/*" onChange={onImageUpload} className="input cursor-pointer" />
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

      {/* ===== Settings Panel (جديد) ===== */}
      <section className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Settings</h2>
          <button
            onClick={saveSettings}
            disabled={savingSettings || loadingSettings}
            className="btn btn-primary"
          >
            {savingSettings ? 'Saving…' : 'Save Settings'}
          </button>
        </div>

        {loadingSettings ? (
          <div className="opacity-70">Loading settings…</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Default Language */}
            <div>
              <label className="block text-sm font-medium mb-1">Default Language</label>
              <select
                className="input"
                value={settings.defaultLang}
                onChange={(e) => setSetting('defaultLang', e.target.value)}
              >
                <option value="ar">Arabic (AR)</option>
                <option value="en">English (EN)</option>
              </select>
              <p className="text-xs opacity-70 mt-1">
                اللغة الافتراضية عند أول زيارة (لو مفيش اختيار محفوظ محليًا).
              </p>
            </div>

            {/* Default Theme */}
            <div>
              <label className="block text-sm font-medium mb-1">Default Theme</label>
              <select
                className="input"
                value={settings.defaultTheme}
                onChange={(e) => setSetting('defaultTheme', e.target.value)}
              >
                {THEME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs opacity-70 mt-1">
                الثيم الافتراضي عند أول زيارة (لو مفيش اختيار محفوظ محليًا).
              </p>
            </div>

            {/* Toggles */}
            <div className="md:col-span-2 grid md:grid-cols-3 gap-3">
              {[
                ['showContactPage', 'Show Contact Page'],
                ['showProjectsPage', 'Show Projects Page'],
                ['showContactSection', 'Show Contact Section (in Profile)'],
                ['showQR', 'Show QR'],
                ['showSocials', 'Show Socials'],
                ['showDownloadCV', 'Show Download CV'],
                ['showDownloadVCard', 'Show Download vCard'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 border border-white/10 rounded-xl px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!settings[key]}
                    onChange={(e) => setSetting(key, e.target.checked)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </section>
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
      provider: 'github',
      options: { redirectTo }
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


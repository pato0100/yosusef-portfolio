import { useEffect, useState } from 'react'
import defaults from '../data/defaultProfile.json'
// ⛳️ استبدلنا التخزين المحلي بدوال السحابة
import { getProfile, upsertProfile } from '../services/cloudStorage'
import { useI18n } from '../i18n/i18n'

// نفس باسورد صفحة التعديل مؤقتًا
const PASSWORD = 'ZZxxZZxx55'

export default function Edit() {
  const { t, lang } = useI18n()

  // ✅ حالة الدخول (لحد ما نفعّل Auth حقيقية)
  const [auth, setAuthState] = useState(false)

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

  // محاولة دخول بباسورد مبسطة (مؤقتًا)
  function tryAuth(e) {
    e.preventDefault()
    const pass = new FormData(e.currentTarget).get('password')
    if (pass === PASSWORD) {
      setAuthState(true)
    } else {
      alert(t.wrong_password)
    }
  }

  // لغة التحرير داخل صفحة Edit (مستقلة عن لغة واجهة الموقع)
  const [editLang, setEditLang] = useState('en') // 'en' | 'ar'

  // ⬇️ جلب البيانات من Supabase أول ما الصفحة تتفتح بعد ما المستخدم يتوثّق
  useEffect(() => {
    if (!auth) return
    (async () => {
      try {
        setLoading(true)
        const remote = await getProfile()
        // لو مفيش داتا على السحابة، نبدأ بالـ defaults
        setData(remote || defaults)
      } catch (e) {
        console.error('load profile failed', e)
        // لو حصل خطأ برضه خلي عندك defaults عشان تقدر تعدّل وتعمل حفظ
        setData(defaults)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth])

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

  // bind helper لحقول ثنائية اللغة
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
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim }
        else if (height > width && height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim }
        else if (width > maxDim) { height = maxDim; width = maxDim }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.82)
        setData((prev) => ({ ...prev, image: compressed }))
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
      await upsertProfile(data) // ← هنا السحر كله
      alert(t.saved)
    } catch (err) {
      console.error(err)
      alert('فشل الحفظ — حاول تاني')
    } finally {
      setSaving(false)
    }
  }

  // شاشة كلمة السر المؤقتة
  if (!auth) {
    return (
      <section className="card max-w-md mx-auto p-6">
        <h2 className="text-xl font-bold">{t.protected}</h2>
        <p className="opacity-80 mt-1">{t.enter_password}</p>
        <form onSubmit={tryAuth} className="mt-4 space-y-3">
          <input name="password" type="password" placeholder={t.password} className="input" />
          <button className="btn btn-primary w-full">{t.continue}</button>
        </form>
      </section>
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
    <section className="card p-6">
      <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

      <form onSubmit={onSave} className="grid md:grid-cols-2 gap-4">
        {/* سويتش لغة المحتوى داخل صفحة التعديل */}
        <div className="md:col-span-2 flex items-center gap-2 mb-1">
          <span className="text-sm opacity-70">Content language:</span>
          <div className="inline-flex rounded-full border border-[var(--card-border)] overflow-hidden">
            <button
              type="button"
              onClick={() => setEditLang('en')}
              className={`px-3 py-1 text-sm ${editLang === 'en' ? 'bg-[var(--brand)] text-[var(--brand-contrast)]' : ''}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setEditLang('ar')}
              className={`px-3 py-1 text-sm ${editLang === 'ar' ? 'bg-[var(--brand)] text-[var(--brand-contrast)]' : ''}`}
            >
              AR
            </button>
          </div>
        </div>

{/* Email */}
<div className="md:col-span-2">
  <label htmlFor="email" className="block text-sm font-medium mb-1">
    {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
  </label>
  <input
    id="email"
    name="email"
    type="email"
    className="input"
    placeholder={lang === 'ar' ? 'name@example.com' : 'name@example.com'}
    value={data.email || ''}
    onChange={onChange}
    inputMode="email"
    autoComplete="email"
  />
  <p className="mt-1 text-xs opacity-70">
    {lang === 'ar'
      ? 'سنستخدمه لزر “إرسال بريد” في صفحة البروفايل.'
      : 'Used for the “Send Email” button on your profile.'}
  </p>
</div>


        {/* حقول ثنائية اللغة */}
        <input className="input" {...bind('name')}  placeholder={editLang === 'ar' ? 'الاسم' : 'Name'} />
        <input className="input" {...bind('title')} placeholder={editLang === 'ar' ? 'المسمى الوظيفي' : 'Title'} />
        <textarea className="input md:col-span-2" {...bind('about')} placeholder={editLang === 'ar' ? 'نبذة' : 'About'} />

        {/* أرقام + تسميات */}
        <input className="input" name="phone"  value={data.phone || ''}  onChange={onChange} placeholder="Phone (+20...)" />
        <input className="input" {...bind('phoneLabel')}
               placeholder={editLang === 'ar' ? 'اسم رقم الهاتف (مثلاً: الشخصي)' : 'Phone label (e.g. Personal)'} />

        <input className="input" name="phone2" value={data.phone2 || ''} onChange={onChange} placeholder="Second Phone (+20...)" />
        <input className="input" {...bind('phone2Label')}
               placeholder={editLang === 'ar' ? 'اسم الرقم الثاني (مثلاً: العمل)' : 'Second phone label (e.g. Work)'} />

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
              <a href={data.cv} target="_blank" rel="noreferrer" className="btn btn-outline">
                {lang === 'ar' ? 'معاينة' : 'Preview'}
              </a>
              <button type="button" onClick={removePdf} className="btn btn-ghost">
                {lang === 'ar' ? 'حذف' : 'Remove'}
              </button>
            </div>
          ) : (
            <>
              <input type="file" accept="application/pdf" onChange={onPdfUpload} className="input cursor-pointer" />
              <p className="text-xs opacity-70">
                {lang === 'ar' ? 'ارفع ملف PDF بحجم أقل من 5MB' : 'Upload a PDF under 5MB'}
              </p>
            </>
          )}
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : t.save}
          </button>
        </div>
      </form>
    </section>
  )
}

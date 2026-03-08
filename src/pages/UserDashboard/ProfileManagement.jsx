import ProfileCropper from '../components/ProfileCropper'

export default function ProfileManagement({
  lang,
  t,
  data,
  setData,
  saving,
  onSave,
  onChange,
  onChangeSocial,
  bind,
  editLang,
  setEditLang,
  username,
  slugValue,
  usernameStatus,
  slugStatus,
  handleUsernameChange,
  handleSlugChange,
  removePdf,
  onPdfUpload,
  profileCropping,
  setProfileCropping,
  onLogout,
}) {
  return (
    <>
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit Profile</h2>

          <button
            onClick={onLogout}
            className="px-3 py-2 rounded-xl border border-white/15 hover:bg-white/5"
          >
            Logout
          </button>
        </div>

        <form onSubmit={onSave} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex items-center gap-2 mb-1">
            <span className="text-sm opacity-70">Content language:</span>

            <div className="inline-flex rounded-full border border-[var(--card-border)] overflow-hidden">
              <button
                type="button"
                onClick={() => setEditLang('en')}
                className={`px-3 py-1 text-sm ${
                  editLang === 'en' ? 'bg-[var(--brand)] text-[var(--brand-contrast)]' : ''
                }`}
              >
                EN
              </button>

              <button
                type="button"
                onClick={() => setEditLang('ar')}
                className={`px-3 py-1 text-sm ${
                  editLang === 'ar' ? 'bg-[var(--brand)] text-[var(--brand-contrast)]' : ''
                }`}
              >
                AR
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>

            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="name@example.com"
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

          <div>
            <label className="block text-sm font-medium mb-1">
              {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
            </label>

            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              disabled={!!data.username}
              className="input"
              placeholder="youssef123"
              dir="ltr"
            />

            {usernameStatus === 'checking' && (
              <p className="text-xs opacity-60 mt-1">
                {lang === 'ar' ? 'جارٍ التحقق...' : 'Checking...'}
              </p>
            )}

            {usernameStatus === 'available' && (
              <p className="text-xs text-green-500 mt-1">
                {lang === 'ar' ? 'متاح ✅' : 'Available ✅'}
              </p>
            )}

            {usernameStatus === 'taken' && (
              <p className="text-xs text-red-500 mt-1">
                {lang === 'ar' ? 'اسم المستخدم مستخدم بالفعل ❌' : 'Already taken ❌'}
              </p>
            )}

            {data.username && (
              <p className="text-xs opacity-60 mt-1">
                {lang === 'ar'
                  ? 'اسم المستخدم ثابت بعد أول حفظ.'
                  : 'Username is locked after first save.'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {lang === 'ar' ? 'الرابط الشخصي' : 'Profile URL'}
            </label>

            <div className="flex items-center rounded-xl border border-white/15 bg-white/5 overflow-hidden">
              <span className="px-3 text-xs opacity-60 whitespace-nowrap" dir="ltr">
                https://shofni.online/
              </span>

              <input
                type="text"
                value={slugValue}
                onChange={handleSlugChange}
                disabled={!!data.slug}
                className="flex-1 bg-transparent px-2 py-2 outline-none"
                placeholder="your-name"
                dir="ltr"
              />
            </div>

            {slugStatus === 'checking' && (
              <p className="text-xs opacity-60 mt-1">
                {lang === 'ar' ? 'جارٍ التحقق...' : 'Checking...'}
              </p>
            )}

            {slugStatus === 'available' && (
              <p className="text-xs text-green-500 mt-1">
                {lang === 'ar' ? 'الرابط متاح ✅' : 'Slug available ✅'}
              </p>
            )}

            {slugStatus === 'taken' && (
              <p className="text-xs text-red-500 mt-1">
                {lang === 'ar' ? 'الرابط مستخدم بالفعل ❌' : 'Slug already taken ❌'}
              </p>
            )}

            {data.slug && (
              <p className="text-xs opacity-60 mt-1">
                {lang === 'ar'
                  ? 'الرابط ثابت بعد أول حفظ.'
                  : 'Slug is locked after first save.'}
              </p>
            )}
          </div>

          <input className="input" {...bind('name')} placeholder={editLang === 'ar' ? 'الاسم' : 'Name'} />
          <input
            className="input"
            {...bind('title')}
            placeholder={editLang === 'ar' ? 'المسمى الوظيفي' : 'Title'}
          />
          <textarea
            className="input md:col-span-2"
            {...bind('about')}
            placeholder={editLang === 'ar' ? 'نبذة' : 'About'}
          />

          <input
            className="input"
            name="phone"
            value={data.phone || ''}
            onChange={onChange}
            placeholder="Phone (+20...)"
          />
          <input
            className="input"
            {...bind('phoneLabel')}
            placeholder={
              editLang === 'ar'
                ? 'اسم رقم الهاتف (مثلاً: الشخصي)'
                : 'Phone label (e.g. Personal)'
            }
          />
          <input
            className="input"
            name="phone2"
            value={data.phone2 || ''}
            onChange={onChange}
            placeholder="Second Phone (+20...)"
          />
          <input
            className="input"
            {...bind('phone2Label')}
            placeholder={
              editLang === 'ar'
                ? 'اسم الرقم الثاني (مثلاً: العمل)'
                : 'Second phone label (e.g. Work)'
            }
          />
          <input
            className="input"
            name="whatsapp"
            value={data.whatsapp || ''}
            onChange={onChange}
            placeholder="WhatsApp (+20...)"
          />

          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-medium">Profile Picture</label>

            {data.image && (
              <img
                src={data.image}
                alt="Profile preview"
                className="w-24 h-24 object-cover rounded-full border border-gray-300 shadow"
              />
            )}

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
                reader.onload = (ev) => setProfileCropping(ev.target.result)
                reader.readAsDataURL(file)
              }}
              className="input cursor-pointer"
            />
          </div>

          <div className="md:col-span-2 grid md:grid-cols-2 gap-3">
            <input
              className="input"
              name="facebook"
              value={data.socials?.facebook || ''}
              onChange={onChangeSocial}
              placeholder="Facebook URL"
            />
            <input
              className="input"
              name="instagram"
              value={data.socials?.instagram || ''}
              onChange={onChangeSocial}
              placeholder="Instagram URL"
            />
            <input
              className="input"
              name="x"
              value={data.socials?.x || ''}
              onChange={onChangeSocial}
              placeholder="X (Twitter) URL"
            />
            <input
              className="input"
              name="linkedin"
              value={data.socials?.linkedin || ''}
              onChange={onChangeSocial}
              placeholder="LinkedIn URL"
            />
            <input
              className="input"
              name="youtube"
              value={data.socials?.youtube || ''}
              onChange={onChangeSocial}
              placeholder="YouTube URL"
            />
            <input
              className="input"
              name="tiktok"
              value={data.socials?.tiktok || ''}
              onChange={onChangeSocial}
              placeholder="TikTok URL"
            />
            <input
              className="input md:col-span-2"
              name="github"
              value={data.socials?.github || ''}
              onChange={onChangeSocial}
              placeholder="GitHub URL"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-medium">
              {lang === 'ar' ? 'السيرة الذاتية (PDF)' : 'CV (PDF)'}
            </label>

            {data.cv ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm opacity-80">
                  {lang === 'ar' ? 'ملف PDF مرفوع' : 'PDF attached'}
                </span>
                <a href={data.cv} target="_blank" rel="noreferrer" className="btn btn-outline">
                  {lang === 'ar' ? 'معاينة' : 'Preview'}
                </a>
                <button type="button" onClick={removePdf} className="btn btn-ghost">
                  {lang === 'ar' ? 'حذف' : 'Remove'}
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={onPdfUpload}
                  className="input cursor-pointer"
                />
                <p className="text-xs opacity-70">
                  {lang === 'ar'
                    ? 'ارفع ملف PDF بحجم أقل من 5MB'
                    : 'Upload a PDF under 5MB'}
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

      {profileCropping && (
        <ProfileCropper
          image={profileCropping}
          onCancel={() => setProfileCropping(null)}
          onConfirm={(croppedBase64) => {
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

              setData((prev) => ({
                ...prev,
                image: compressed,
                imageUrl: prev.imageUrl || '',
              }))

              setProfileCropping(null)
            }

            img.src = croppedBase64
          }}
        />
      )}
    </>
  )
}
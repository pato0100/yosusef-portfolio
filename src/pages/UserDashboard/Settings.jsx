import { THEME_OPTIONS } from '../../data/themes'
import Dropdown from '../../components/Dropdown'

function ThemeSelector({ value, onChange, customTheme }) {
  const previewTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
  }

  const resetTheme = () => {
    document.documentElement.setAttribute('data-theme', value)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
      {THEME_OPTIONS.map((theme) => {
        const active = value === theme.value

        const colors =
          theme.value === 'custom' && customTheme
            ? [customTheme.brand, customTheme.background, customTheme.text]
            : theme.preview || ['#00bcd4', '#0f172a', '#ffffff']

        return (
          <button
            key={theme.value}
            type="button"
            onClick={() => onChange(theme.value)}
            onMouseEnter={() => previewTheme(theme.value)}
            onMouseLeave={resetTheme}
            className={`rounded-xl border p-3 text-left transition hover:scale-[1.05] ${
              active ? 'ring-2 ring-[var(--brand)] shadow-lg' : ''
            }`}
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{theme.icon || '🎨'}</span>
              <span className="text-sm font-medium">{theme.label}</span>
            </div>

            <div
              className="rounded-lg border overflow-hidden"
              style={{
                borderColor: 'var(--card-border)',
                background: colors[1],
              }}
            >
              <div className="h-2" style={{ background: colors[0] }} />

              <div className="p-2 space-y-1">
                <div className="h-2 rounded" style={{ background: colors[2], opacity: 0.8 }} />
                <div
                  className="h-2 rounded w-3/4"
                  style={{ background: colors[2], opacity: 0.6 }}
                />
                <div
                  className="h-2 rounded w-1/2"
                  style={{ background: colors[2], opacity: 0.4 }}
                />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ToggleSwitch({ value, onChange, lang }) {
  return (
    <button
      onClick={onChange}
      className="relative w-12 h-6 rounded-full transition duration-300"
      style={{
        background: value ? 'var(--brand)' : 'var(--card-border)',
        boxShadow: value ? '0 0 8px var(--brand)' : 'none',
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition duration-300"
        style={{
          left: lang === 'ar' ? 'auto' : '0.5px',
          right: lang === 'ar' ? '0.5px' : 'auto',
          transform:
            lang === 'ar'
              ? value
                ? 'translateX(-24px)'
                : 'translateX(0)'
              : value
              ? 'translateX(24px)'
              : 'translateX(0)',
        }}
      />
    </button>
  )
}

export default function Settings({
  lang,
  settings,
  settingsTab,
  setSettingsTab,
  loadingSettings,
  savingSettings,
  settingsChanged,
  saveSettings,
  setSetting,
  customTheme,
  setCustomTheme,
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">{lang === 'ar' ? 'الإعدادات' : 'Settings'}</h2>

        <button
          onClick={saveSettings}
          disabled={savingSettings || loadingSettings || !settingsChanged}
          className="btn btn-primary"
        >
          {savingSettings
            ? lang === 'ar'
              ? 'جارٍ الحفظ…'
              : 'Saving…'
            : lang === 'ar'
            ? 'حفظ الإعدادات'
            : 'Save Settings'}
        </button>
      </div>

      {loadingSettings ? (
        <div className="opacity-70">Loading settings…</div>
      ) : (
        <>
          <div className="flex gap-2 mb-8 flex-wrap">
            {[
              ['general', lang === 'ar' ? 'عام' : 'General'],
              ['pages', lang === 'ar' ? 'الصفحات' : 'Pages'],
              ['profile', lang === 'ar' ? 'الملف الشخصي' : 'Profile'],
              ['downloads', lang === 'ar' ? 'التحميلات' : 'Downloads'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSettingsTab(key)}
                className={`px-4 py-1.5 rounded-lg text-sm transition ${
                  settingsTab === key ? 'bg-[var(--brand)] text-[var(--brand-contrast)]' : 'border'
                }`}
                style={{
                  borderColor: 'var(--card-border)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {settingsTab === 'general' && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-4 border hover:shadow-md transition"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <label className="block text-sm font-medium mb-2">
                    {lang === 'ar' ? 'اللغة الافتراضية' : 'Default Language'}
                  </label>

                  <Dropdown
                    value={settings.defaultLang}
                    onChange={(v) => setSetting('defaultLang', v)}
                    options={[
                      { value: 'ar', label: 'العربية' },
                      { value: 'en', label: 'English' },
                    ]}
                  />
                </div>

                <div
                  className="rounded-xl p-4 border hover:shadow-md transition"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <label className="block text-sm font-medium mb-2">
                    {lang === 'ar' ? 'الثيم الافتراضي' : 'Default Theme'}
                  </label>

                  <ThemeSelector
                    value={settings.defaultTheme}
                    onChange={(v) => setSetting('defaultTheme', v)}
                    customTheme={customTheme}
                  />
                </div>
              </div>

              <div className="mt-6 border rounded-xl p-4">
                <h3 className="font-semibold mb-3">🎨 Custom Theme</h3>

                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-sm">
                    Brand Color
                    <input
                      type="color"
                      value={customTheme.brand}
                      onChange={(e) => {
                        setCustomTheme((prev) => ({ ...prev, brand: e.target.value }))
                        setSetting('defaultTheme', 'custom')
                      }}
                    />
                  </label>

                  <label className="text-sm">
                    Background
                    <input
                      type="color"
                      value={customTheme.background}
                      onChange={(e) => {
                        setCustomTheme((prev) => ({ ...prev, background: e.target.value }))
                        setSetting('defaultTheme', 'custom')
                      }}
                    />
                  </label>

                  <label className="text-sm">
                    Card
                    <input
                      type="color"
                      value={customTheme.card}
                      onChange={(e) => {
                        setCustomTheme((prev) => ({ ...prev, card: e.target.value }))
                        setSetting('defaultTheme', 'custom')
                      }}
                    />
                  </label>

                  <label className="text-sm">
                    Text
                    <input
                      type="color"
                      value={customTheme.text}
                      onChange={(e) => {
                        setCustomTheme((prev) => ({ ...prev, text: e.target.value }))
                        setSetting('defaultTheme', 'custom')
                      }}
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {settingsTab === 'pages' && (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ['showContactPage', lang === 'ar' ? 'صفحة التواصل' : 'Contact Page', '📩'],
                ['showProjectsPage', lang === 'ar' ? 'صفحة المشاريع' : 'Projects Page', '📁'],
              ].map(([key, label, icon]) => (
                <div
                  key={key}
                  className="rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'var(--brand)',
                        color: 'var(--brand-contrast)',
                      }}
                    >
                      {icon}
                    </div>

                    <div className="text-sm font-medium">{label}</div>
                  </div>

                  <ToggleSwitch
                    value={settings[key]}
                    onChange={() => setSetting(key, !settings[key])}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
          )}

          {settingsTab === 'profile' && (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ['showQR', lang === 'ar' ? 'رمز QR' : 'QR Code', '🔳'],
                ['showSocials', lang === 'ar' ? 'روابط التواصل' : 'Social Links', '🌐'],
                ['showCall', lang === 'ar' ? 'زر الاتصال' : 'Call Button', '📞'],
                [
                  'showSendEmail',
                  lang === 'ar' ? 'زر ارسال البريد الإلكتروني' : 'Send Email',
                  '📧',
                ],
              ].map(([key, label, icon]) => (
                <div
                  key={key}
                  className="rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'var(--brand)',
                        color: 'var(--brand-contrast)',
                      }}
                    >
                      {icon}
                    </div>

                    <div className="text-sm font-medium">{label}</div>
                  </div>

                  <ToggleSwitch
                    value={settings[key]}
                    onChange={() => setSetting(key, !settings[key])}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
          )}

          {settingsTab === 'downloads' && (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ['showDownloadCV', lang === 'ar' ? 'تحميل السيرة الذاتية' : 'Download CV', '📄'],
                [
                  'showDownloadVcard',
                  lang === 'ar' ? 'تحميل جهة الاتصال' : 'Download Contact',
                  '👤',
                ],
              ].map(([key, label, icon]) => (
                <div
                  key={key}
                  className="rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'var(--brand)',
                        color: 'var(--brand-contrast)',
                      }}
                    >
                      {icon}
                    </div>

                    <div className="text-sm font-medium">{label}</div>
                  </div>

                  <ToggleSwitch
                    value={settings[key]}
                    onChange={() => setSetting(key, !settings[key])}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
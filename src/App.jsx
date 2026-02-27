import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Profile from './pages/Profile.jsx'
import Projects from './pages/Projects.jsx'
import Contact from './pages/Contact.jsx'
import Edit from './pages/Edit.jsx'
import Navbar from './components/Navbar.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'
import { useI18n } from './i18n/i18n.jsx'
import { getSettings } from './services/settings'

export default function App() {
  const { t, setLang } = useI18n()
  const loc = useLocation()

  const [settings, setSettings] = useState(null)

  // 🔥 تحميل Settings من Supabase مرة واحدة عند التشغيل
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings()
        setSettings(data)

        // ✅ تطبيق الثيم
        const root = document.documentElement
        root.setAttribute('data-theme', data.defaultTheme)
        root.classList.toggle('dark', data.defaultTheme === 'dark')

        // ✅ تطبيق اللغة فعليًا
        setLang(data.defaultLang)

      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }

    loadSettings()
  }, [])

  // عنوان الصفحة
  useEffect(() => {
    document.title = `Youssef | ${t.profile}`
  }, [loc, t])

  // 🔥🔥🔥 Premium Loader
if (!settings) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden">
      
      <div className="relative flex items-center justify-center">
        
        {/* 🔵 Glow Layer */}
        <div className="absolute w-72 h-72 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>

        {/* 🧠 Logo */}
        <img
          src="/assets/themes/agogovich-bg.png"
          alt="Agogovich Technology"
          className="relative w-64 md:w-80 drop-shadow-[0_0_35px_rgba(0,255,255,0.6)] transition-all duration-700"
        />

      </div>

    </div>
  )
}

  return (
    <div className="min-h-screen">
      <header className="container-max flex items-center justify-between py-6">
        <Link to="/" className="text-lg font-bold"></Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeSwitcher defaultTheme={settings.defaultTheme} />
        </div>
      </header>

      <Navbar />

      <main className="container-max py-8">
        <Routes>
          <Route path="/" element={<Profile />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/edit" element={<Edit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="container-max py-10 text-center text-sm opacity-70">
        <p>© {new Date().getFullYear()} Youssef — {t.made_with}</p>
      </footer>
    </div>
  )
}
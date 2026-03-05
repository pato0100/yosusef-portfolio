import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ThemeProvider from "./providers/ThemeProvider"
import Profile from './pages/Profile.jsx'
import Projects from './pages/Projects.jsx'
import ProjectDetails from './pages/ProjectDetails.jsx'
import Contact from './pages/Contact.jsx'
import Edit from './pages/Edit.jsx'
import RootRedirect from './pages/RootRedirect.jsx'
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Navbar from './components/Navbar.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'

import { useI18n } from './i18n/i18n.jsx'
import { getSettings } from './services/settings'

export default function App() {
  const { t, setLang } = useI18n()
  const loc = useLocation()

  const [settings, setSettings] = useState(null)

  // 🔥 استخراج slug من الـ URL
  const pathParts = loc.pathname.split('/').filter(Boolean)
  const defaultUser = import.meta.env.VITE_DEFAULT_USERNAME
  const currentSlug = pathParts[0] || defaultUser

  // 🔥 تحميل Settings حسب slug
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings(currentSlug)
        setSettings(data)

        // تطبيق الثيم
        const root = document.documentElement
        root.setAttribute('data-theme', data.defaultTheme)
        root.classList.toggle('dark', data.defaultTheme === 'dark')

        // تطبيق اللغة
        setLang(data.defaultLang)

      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }

    loadSettings()
  }, [currentSlug])

  // عنوان الصفحة
  useEffect(() => {
    document.title = `${currentSlug} | ${t.profile}`
  }, [loc, t, currentSlug])

  // 🔥 Loader
  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-72 h-72 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>

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

<ThemeProvider slug={currentSlug}>

<div className="min-h-screen">

      <header className="container-max flex items-center justify-between py-6">
        <Link to="/" className="text-lg font-bold"></Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeSwitcher defaultTheme={settings.defaultTheme} />
        </div>
      </header>

      <Navbar settings={settings} />

      <main className="container-max py-8">

        <Routes>

<Route path="/login" element={<Login />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/edit" element={<RedirectToMyEdit />} />
  
<Route
  path="/:slug/edit"
  element={
    <ProtectedRoute>
      <Edit />
    </ProtectedRoute>
  }
/>

  <Route path="/" element={<RootRedirect />} />

  <Route path="/:slug" element={<Profile />} />
  <Route
  path="/:slug/projects"
  element={
    settings.showProjectsPage
      ? <Projects />
      : <Navigate to={`/${currentSlug}`} replace />
  }
/>

  <Route
  path="/:slug/projects/:projectSlug"
  element={
    settings.showProjectsPage
      ? <ProjectDetails />
      : <Navigate to={`/${currentSlug}`} replace />
  }
/>

  <Route
  path="/:slug/contact"
  element={
    settings.showContactPage
      ? <Contact />
      : <Navigate to={`/${currentSlug}`} replace />
  }
/>

  <Route path="*" element={<Navigate to="/" replace />} />

</Routes>

      </main>

      <footer className="container-max py-10 text-center text-sm opacity-70">
        <p>© {new Date().getFullYear()} {currentSlug} — {t.made_with}</p>
      </footer>

    </div>

</ThemeProvider>

)
}
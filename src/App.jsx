import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ThemeProvider from "./providers/ThemeProvider"
import Profile from './pages/Profile.jsx'
import Projects from './pages/Projects.jsx'
import ProjectDetails from './pages/ProjectDetails.jsx'
import Contact from './pages/Contact.jsx'
import DashboardPage from './pages/UserDashboard/DashboardPage'
import RootRedirect from './pages/RootRedirect.jsx'
import RedirectToMyEdit from "./pages/RedirectToMyEdit"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Navbar from './components/Navbar.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'
import AdminLayout from "./admin/AdminLayout"
import Dashboard from "./admin/Dashboard"
import Users from "./admin/Users"
import Invites from "./admin/Invites"
import { useI18n } from './i18n/i18n.jsx'
import { getSettings } from './services/settings'
import UserDetails from "./admin/UserDetails"
import Plans from "./admin/Plans"


export default function App() {
  const { t, setLang } = useI18n()
  const loc = useLocation()

  const [settings, setSettings] = useState(null)

  // استخراج slug من الـ URL
  const pathParts = loc.pathname.split('/').filter(Boolean)
  const defaultUser = import.meta.env.VITE_DEFAULT_USERNAME
  const currentSlug = pathParts[0] || defaultUser

  // تحميل Settings حسب slug مع cache لتقليل flicker
  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      try {
        const cacheKey = `shofni-settings:${currentSlug}`
        const cachedRaw = sessionStorage.getItem(cacheKey)
        const root = document.documentElement

        // 1) طبّق الكاش فورًا لو موجود
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw)

            if (cached?.defaultTheme) {
              root.setAttribute('data-theme', cached.defaultTheme)
              root.classList.toggle('agogovich', cached.defaultTheme === 'agogovich')
            }

            if (cached?.defaultLang) {
              setLang(cached.defaultLang)
            }

            setSettings(cached)
          } catch (e) {
            console.error('Failed to parse cached settings:', e)
          }
        }

        // 2) حمّل من المصدر الحقيقي
        const data = await getSettings(currentSlug)
        if (cancelled || !data) return

        setSettings(data)
        sessionStorage.setItem(cacheKey, JSON.stringify(data))

        root.setAttribute('data-theme', data.defaultTheme)
        root.classList.toggle('agogovich', data.defaultTheme === 'agogovich')

        setLang(data.defaultLang)
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    }

    loadSettings()

    return () => {
      cancelled = true
    }
  }, [currentSlug, setLang])

  // عنوان الصفحة
  useEffect(() => {
    document.title = `${currentSlug} | ${t.profile}`
  }, [loc, t, currentSlug])

  // Loader
  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse bg-cyan-500"></div>

          <img
            src="/assets/themes/agogovich-bg.png"
            alt="Shofni"
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
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/edit" element={<RedirectToMyEdit />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="users/:id" element={<UserDetails />} />
              <Route path="invites" element={<Invites />} />
              <Route path="plans" element={<Plans />} />
            </Route>

            <Route
              path="/:slug/edit"
              element={
                <ProtectedRoute>
                  <DashboardPage />
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
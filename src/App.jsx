import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Profile from './pages/Profile.jsx'
import Projects from './pages/Projects.jsx'
import Contact from './pages/Contact.jsx'
import Edit from './pages/Edit.jsx'
import Navbar from './components/Navbar.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'
import { useI18n } from './i18n/i18n.jsx'



export default function App() {
const { t } = useI18n()
const loc = useLocation()


useEffect(() => {
document.title = `Youssef | ${t.profile}`
}, [loc, t])


return (
<div className="min-h-screen">
<header className="container-max flex items-center justify-between py-6">
<Link to="/" className="text-lg font-bold"></Link>
<div className="flex items-center gap-2">
<LanguageToggle />
<ThemeSwitcher />
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


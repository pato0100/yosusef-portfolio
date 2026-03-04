import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/i18n'
import { motion } from 'framer-motion'

export default function Navbar({ settings }) {
  const { t, lang } = useI18n()
  const { pathname } = useLocation()

  // استخراج slug من URL
  const pathParts = pathname.split('/').filter(Boolean)
  const currentSlug = pathParts[0]
  if (!currentSlug) return null

  const base = `/${currentSlug}`

  const tabs = [
  { key: 'profile', label: t.profile, path: `${base}` },

  settings?.showProjectsPage && {
    key: 'projects',
    label: t.projects,
    path: `${base}/projects`,
  },

  settings?.showContactPage && {
    key: 'contact',
    label: t.contact,
    path: `${base}/contact`,
  },
].filter(Boolean)

  return (
    <motion.nav
      className="container-max sticky top-4 z-50"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <ul
        className={`nav-glass relative mx-auto flex w-fit items-center gap-2 px-2 py-2 rounded-full ${
          lang === 'ar' ? 'rtl:text-right' : ''
        }`}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {tabs.map(tab => {
          let active = false

if (tab.key === 'profile') {
  active = pathname === base
}

if (tab.key === 'projects') {
  active = pathname.startsWith(`${base}/projects`)
}

if (tab.key === 'contact') {
  active = pathname.startsWith(`${base}/contact`)
}

          return (
            <li key={tab.key} className="relative">
              <NavLink
                to={tab.path}
                className="btn-nav relative z-10"
              >
                {tab.label}
              </NavLink>

              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="active-pill"
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 38,
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>
    </motion.nav>
  )
}
import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/i18n'
import { motion } from 'framer-motion'

export default function Navbar() {
  const { t, lang } = useI18n()
  const { pathname } = useLocation()

  const tabs = [
    { to: '/', label: t.profile },
    { to: '/projects', label: t.projects },
    { to: '/contact', label: t.contact },
  ]

  return (
    <motion.nav
      className="container-max sticky top-4 z-50"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <ul
        className={`nav-glass mx-auto flex w-fit items-center gap-2 px-2 py-2 rounded-full ${
          lang === 'ar' ? 'rtl:text-right' : ''
        }`}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {tabs.map(tab => {
          const active = pathname === tab.to
          return (
            <li key={tab.to} className="relative">
              <NavLink to={tab.to} className={`btn-nav btn-3d ${active ? 'active' : ''}`}>
                {tab.label}
              </NavLink>

              {active && (
                <motion.div
                  layoutId="nav-underline"
                  className="nav-underline"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </li>
          )
        })}
      </ul>
    </motion.nav>
  )
}

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/i18n'

export default function ProjectDetails() {
  const { slug, projectSlug } = useParams()

  const { lang } = useI18n()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

function getLocalized(project, key) {
  if (!project) return ''

  if (lang === 'ar') {
    return (
      project[`${key}_ar`] ||
      project[`${key}_en`] ||
      project[key] ||
      ''
    )
  }

  return (
    project[`${key}_en`] ||
    project[`${key}_ar`] ||
    project[key] ||
    ''
  )
}

 useEffect(() => {
  if (!slug || !projectSlug) return

  async function loadProject() {
    try {
      setLoading(true)
      setNotFound(false)

      // 1️⃣ Get profile id
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id')
  .eq('slug', slug)
  .single()

if (profileError || !profile) {
  setNotFound(true)
  return
}

// 2️⃣ Get project
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('owner_id', profile.id)
  .eq('slug', projectSlug)
  .eq('is_deleted', false)   // 👈 مهم
  .eq('is_active', true)     // 👈 مهم
  .single()

if (error || !data) {
  setNotFound(true)
  return
}

      setProject({
  ...data,
  views: (data.views || 0) + 1,
})

      // SEO


      // Increment views (بدون RPC لو مش عامل function)
      await supabase
        .from('projects')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id)

    } catch (err) {
      console.error(err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  loadProject()
}, [slug, projectSlug])

useEffect(() => {
  if (!project) return

  const localizedTitle = getLocalized(project, 'title')
  document.title = `${localizedTitle} | ${slug}`

}, [project, lang])


  /* -------------------- STATES -------------------- */

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center opacity-70">
        Loading project…
      </div>
    )
  }

  if (notFound || !project) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-4">
        <p className="text-lg font-semibold">Project not found</p>
        <Link
          to={`/${slug}/projects`}
          className="underline opacity-80 hover:opacity-100"
        >
          ← Back to Projects
        </Link>
      </div>
    )
  }

  /* -------------------- UI -------------------- */

  return (
    <motion.section
      className="max-w-5xl mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      {/* Cover */}
      {project.cover_image && (
        <div className="mb-10 rounded-3xl overflow-hidden border border-white/10">
          <img
            src={project.cover_image}
            alt={getLocalized(project, 'title')}
            className="w-full aspect-[16/9] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {getLocalized(project, 'title')}
        </h1>

        {getLocalized(project, 'short_description') && (
          <p
  className="opacity-80 max-w-3xl"
  dir={lang === 'ar' ? 'rtl' : 'ltr'}
>
  {getLocalized(project, 'short_description')}
</p>
        )}

        <div className="text-sm opacity-60 mt-3">
          Views: {project.views ?? 0}
        </div>
      </header>

      {/* Full Description */}
      {getLocalized(project, 'full_description') && (
        <p
  className="leading-relaxed opacity-85 mb-10 max-w-3xl"
  dir={lang === 'ar' ? 'rtl' : 'ltr'}
>
  {getLocalized(project, 'full_description')}
</p>
      )}

      {/* {lang === 'ar' ? 'التقنيات المستخدمة' : 'Tech Stack'} */}
      {project.tech_stack?.length > 0 && (
        <section className="mb-12">
          <h3 className="text-lg font-semibold mb-4">
  {lang === 'ar' ? 'التقنيات المستخدمة' : 'Tech Stack'}
</h3>
          <div className="flex flex-wrap gap-3">
            {project.tech_stack.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {project.gallery?.length > 0 && (
        <section className="grid md:grid-cols-2 gap-6 mb-12">
          {project.gallery.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              loading="lazy"
              className="rounded-2xl border border-white/10 hover:scale-[1.02] transition"
            />
          ))}
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-12">
        {project.live_url && (
          <a
            href={project.live_url}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition text-black font-medium"
          >
            {lang === 'ar' ? 'رابط المشروع' : 'Link Project'}
          </a>
        )}

        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition"
          >
            GitHub
          </a>
        )}
      </div>

      {/* Back */}
      <Link
        to={`/${slug}/projects`}
        className="inline-block underline opacity-80 hover:opacity-100"
      >
        {lang === 'ar' ? 'الرجوع إلى المشاريع →' : '← Back to Projects'}
        
      </Link>

    </motion.section>
  )
}
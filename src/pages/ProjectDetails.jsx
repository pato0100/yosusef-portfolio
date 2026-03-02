import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'

export default function ProjectDetails() {
  const { slug, projectSlug } = useParams()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug || !projectSlug) return

    async function loadProject() {
      try {
        setLoading(true)

        // 1️⃣ Get profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', slug)
          .single()

        if (profileError || !profile) {
          setProject(null)
          return
        }

        // 2️⃣ Get project
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', profile.id)
          .eq('slug', projectSlug)
          .eq('is_active', true)
          .single()

        if (error || !data) {
          setProject(null)
          return
        }

        setProject(data)

        // 3️⃣ Increment views
        await supabase
          .from('projects')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', data.id)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [slug, projectSlug])

  if (loading) return <div>Loading project...</div>

  if (!project)
    return (
      <div>
        <p>Project not found.</p>
        <Link to={`/${slug}/projects`} className="underline">
          Back to projects
        </Link>
      </div>
    )

  return (
    <motion.section
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-2xl font-bold mb-3">
        {project.title}
      </h1>

      {project.full_description && (
        <p className="opacity-80 mb-6">
          {project.full_description}
        </p>
      )}

      {/* Tech Stack */}
      {project.tech_stack?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {project.tech_stack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-full bg-white/10 text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {project.gallery?.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {project.gallery.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="rounded-xl border border-white/10"
            />
          ))}
        </div>
      )}

      {/* Links */}
      <div className="flex gap-4 mt-6">
        {project.live_url && (
          <a
            href={project.live_url}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Live Demo
          </a>
        )}

        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            GitHub
          </a>
        )}
      </div>

      <div className="mt-8 text-sm opacity-60">
        Views: {project.views || 0}
      </div>

      <div className="mt-6">
        <Link to={`/${slug}/projects`} className="underline">
          ← Back to Projects
        </Link>
      </div>
    </motion.section>
  )
}
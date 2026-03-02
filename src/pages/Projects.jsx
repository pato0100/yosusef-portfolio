import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'

export default function Projects() {
  const { slug } = useParams()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    async function loadProjects() {
      try {
        setLoading(true)

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', slug)
          .single()

        if (!profile) {
          setProjects([])
          return
        }

        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        setProjects(data || [])

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [slug])

  if (loading) return <div>Loading projects...</div>

  if (!projects.length)
    return <div>No projects yet.</div>

  return (
    <section className="grid md:grid-cols-2 gap-6">
      {projects.map((p, i) => (
        <motion.article
          key={p.id}
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <h3 className="text-lg font-semibold">
            {p.title}
          </h3>

          {p.short_description && (
            <p className="text-sm opacity-80 mt-1">
              {p.short_description}
            </p>
          )}

          <Link
            to={`/${slug}/projects/${p.slug}`}
            className="mt-4 inline-block underline"
          >
            View Details
          </Link>
        </motion.article>
      ))}
    </section>
  )
}
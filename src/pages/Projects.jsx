import { projects } from '../data/projects'
import { motion } from 'framer-motion'


export default function Projects(){
return (
<section className="grid md:grid-cols-2 gap-6">
{projects.map((p,i)=> (
<motion.article key={p.id} className="card p-6" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
<h3 className="text-lg font-semibold">{p.title}</h3>
<p className="text-sm opacity-80 mt-1">{p.desc}</p>
<div className="mt-3 flex gap-2 flex-wrap">
{p.tags.map(t=> <span key={t} className="px-3 py-1 rounded-full bg-white/70 dark:bg-white/10 text-xs">{t}</span>)}
</div>
<a href={p.link} className="mt-4 inline-block underline">Visit</a>
</motion.article>
))}
</section>
)
}
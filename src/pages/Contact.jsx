import defaultData from '../data/defaultProfile.json'
import { loadProfile } from '../utils/storage'


export default function Contact(){
const { email, phone, whatsapp } = loadProfile(defaultData)
const tel = phone ? `tel:${phone}` : '#'
const wa = whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g,'')}` : '#'


return (
<section className="card p-6">
<h2 className="text-xl font-bold">Contact</h2>
<ul className="mt-4 space-y-2">
<li><a className="underline" href={`mailto:${email}`}>{email}</a></li>
<li><a className="underline" href={tel}>{phone}</a></li>
<li><a className="underline" href={wa} target="_blank" rel="noreferrer">WhatsApp</a></li>
</ul>
</section>
)
}
import { useState, useRef, useEffect } from "react"

export default function Dropdown({value,options,onChange}){

const [open,setOpen]=useState(false)
const ref=useRef()

useEffect(()=>{

function handleClick(e){
if(ref.current && !ref.current.contains(e.target)){
setOpen(false)
}
}

document.addEventListener("mousedown",handleClick)
return()=>document.removeEventListener("mousedown",handleClick)

},[])

const selected=options.find(o=>o.value===value)

return(

<div ref={ref} className="relative">

<button
type="button"
onClick={()=>setOpen(!open)}
className="input flex justify-between items-center"
style={{
background:"var(--card-bg)",
color:"var(--text)"
}}
>

<span>{selected?.label}</span>

<span className={`transition ${open?"rotate-180":""}`}>
▼
</span>

</button>

{open && (

<div
className="absolute mt-2 w-full rounded-xl border shadow-lg z-50 overflow-hidden"
style={{
background:"var(--card-bg)",
borderColor:"var(--card-border)"
}}
>

{options.map(option=>(
<button
key={option.value}
onClick={()=>{
onChange(option.value)
setOpen(false)
}}
className="w-full text-left px-3 py-2 hover:bg-[var(--brand)] hover:text-[var(--brand-contrast)] transition"
>

{option.label}

</button>
))}

</div>

)}

</div>

)

}
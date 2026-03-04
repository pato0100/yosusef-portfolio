export const THEME_OPTIONS = [

{ value:"dark", label:"🌙 Dark", preview:["#60a5fa","#0b1220","#e5e7eb"] },

{ value:"ocean", label:"🌊 Ocean", preview:["#0891b2","#e6f8ff","#0f172a"] },

{ value:"sunset", label:"🌅 Sunset", preview:["#f97316","#fff1f1","#0f172a"] },

{ value:"mint", label:"🌿 Mint", preview:["#10b981","#ecfff6","#0f172a"] },

{ value:"cyberpunk", label:"⚡ Cyberpunk", preview:["#ff57f6","#0a0012","#ffe8ff"] },

{ value:"matrix", label:"🟩 Matrix", preview:["#22c55e","#000000","#dcfce7"] },

{ value:"aurora", label:"🌌 Aurora", preview:["#0ea5e9","#e6fffa","#0f172a"] },

{ value:"agogovich", label:"💎 Agogovich Tech", preview:["#00c9ff","#000510","#e0f2ff"] },

{ value:"tech", label:"🧠 Tech Gray", preview:["#3b82f6","#f5f6f7","#0f172a"] },

{ value:"galaxy", label:"💜 Galaxy", preview:["#8b5cf6","#0a011a","#ede9fe"] },

{ value:"nord", label:"❄️ Nord", preview:["#2563eb","#e5f0f4","#0f172a"] },

{ value:"slate-neon", label:"💙 Slate Neon", preview:["#38bdf8","#0f172a","#e2e8f0"] },

{ value:"future-blue", label:"🚀 Future Blue", preview:["#2563eb","#f0f7ff","#0f172a"] },

{ value:"lava-burst", label:"🔥 Lava Burst", preview:["#ff4500","#1a0a05","#ffece6"] },

{ value:"chrome-green", label:"🧪 Chrome Green", preview:["#00ff80","#0d1f11","#dfffe8"] },

{ value:"solar-flare", label:"☀️ Solar Flare", preview:["#ff8c00","#fff8f0","#231a10"] },

{ value:"midnight-glow", label:"🌌 Midnight Glow", preview:["#6194ff","#06022a","#e8f4ff"] },

{ value:"beta-tech", label:"🖥️ Beta Tech", preview:["#10b981","#f2f4f6","#0d131b"] },

{ value:"neon-synth", label:"💫 Neon Synth", preview:["#c084fc","#0a0014","#e0e0ff"] },

{ value:"hologram", label:"🪩 Hologram", preview:["#e879f9","#f8f0ff","#1a1a2e"] },

{ value:"quantum", label:"🧬 Quantum Blue", preview:["#3b82f6","#05011a","#dbeafe"] },

{ value:"plasma", label:"⚛️ Plasma Energy", preview:["#06b6d4","#0b1d29","#e0f2fe"] },

{ value:"carbon-fiber", label:"🩶 Carbon Fiber", preview:["#737373","#0d0d0d","#e5e5e5"] },

{ value:"glass-white", label:"🤍 Glass White", preview:["#2563eb","#ffffff","#0f172a"] },

{ value:"hyper-orange", label:"🧡 Hyper Orange", preview:["#ff4500","#2b0000","#ffe4cc"] },

{ value:"polar-night", label:"🌑 Polar Night", preview:["#60a5fa","#0b1120","#dbeafe"] },

{ value:"nano-green", label:"🧫 Nano Green", preview:["#22c55e","#02130a","#dcfce7"] },

{ value:"infrared", label:"🔴 Infrared", preview:["#ef4444","#200000","#fee2e2"] },

{ value:"neptune", label:"🪐 Neptune", preview:["#2563eb","#000820","#bfdbfe"] },

{ value:"lunar-dust", label:"🌕 Lunar Dust", preview:["#4b5563","#e5e7eb","#1f2937"] },

{ value:"stellar-blue", label:"💠 Stellar Blue", preview:["#38bdf8","#0a1128","#e0f2fe"] },

{ value:"silver-core", label:"⚙️ Silver Core", preview:["#6b7280","#e5e7eb","#111827"] },

{ value:"iceberg", label:"🧊 Iceberg", preview:["#3b82f6","#e0f2fe","#0f172a"] },

{ value:"volt", label:"⚡ Volt Electric", preview:["#eab308","#0a0a00","#fefce8"] },

{ value:"cosmic-rose", label:"🌸 Cosmic Rose", preview:["#ec4899","#1a0010","#fce7f3"] },

{ value:"zero-gravity", label:"🚀 Zero Gravity", preview:["#818cf8","#000000","#f1f5f9"] },

{ value:"black-hole", label:"🕳️ Black Hole", preview:["#6b21a8","#000000","#e5e7eb"] },

{ value:"synthwave", label:"🎛️ Synthwave", preview:["#ec4899","#1b003a","#fbcfe8"] },

{ value:"custom", label:"🎨 My Theme", preview:["#00c9ff","#0a0f1a","#ffffff"] }

]



export function isValidTheme(v){
return THEME_OPTIONS.some(t=>t.value===v)
}
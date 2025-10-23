// src/components/ThemeSwitcher.jsx
import { useEffect, useState } from "react";
import FancySelect from "./FancySelect";
import { getTheme, setTheme } from "../utils/storage";

const options = [
  { value: "dark", label: "🌙 Dark" },
  { value: "ocean", label: "🌊 Ocean" },
  { value: "sunset", label: "🌅 Sunset" },
  { value: "mint", label: "🌿 Mint" },
  { value: "cyberpunk", label: "⚡ Cyberpunk" },
  { value: "matrix", label: "🟩 Matrix" },
  { value: "aurora", label: "🌌 Aurora" },
  { value: "agogovich", label: "💎 Agogovich Tech" },
  { value: "tech", label: "🧠 Tech Gray" },
  { value: "galaxy", label: "💜 Galaxy" },
  { value: "nord", label: "❄️ Nord" },
  { value: "slate-neon", label: "💙 Slate Neon" },
  { value: "future-blue", label: "🚀 Future Blue" },
    { value: "lava-burst",    label: "🔥 Lava Burst" },
  { value: "chrome-green",  label: "🧪 Chrome Green" },
  { value: "solar-flare",   label: "☀️ Solar Flare" },
  { value: "midnight-glow", label: "🌌 Midnight Glow" },
  { value: "beta-tech",     label: "🖥️ Beta Tech" },
    { value: "neon-synth", label: "💫 Neon Synth" },
  { value: "hologram", label: "🪩 Hologram" },
  { value: "quantum", label: "🧬 Quantum Blue" },
  { value: "plasma", label: "⚛️ Plasma Energy" },
{ value: "carbon-fiber", label: "🩶 Carbon Fiber" },
{ value: "glass-white", label: "🤍 Glass White" },
{ value: "hyper-orange", label: "🧡 Hyper Orange" },
{ value: "polar-night", label: "🌑 Polar Night" },
{ value: "nano-green", label: "🧫 Nano Green" },
{ value: "infrared", label: "🔴 Infrared" },
{ value: "neptune", label: "🪐 Neptune" },
{ value: "lunar-dust", label: "🌕 Lunar Dust" },
{ value: "stellar-blue", label: "💠 Stellar Blue" },
{ value: "silver-core", label: "⚙️ Silver Core" },
{ value: "iceberg", label: "🧊 Iceberg" },
{ value: "volt", label: "⚡ Volt Electric" },
{ value: "cosmic-rose", label: "🌸 Cosmic Rose" },
{ value: "zero-gravity", label: "🚀 Zero Gravity" },
{ value: "black-hole", label: "🕳️ Black Hole" },
{ value: "synthwave", label: "🎛️ Synthwave" },

];


export default function ThemeSwitcher(){
  // أي قيمة فاضية أو light تتحول لـ dark
  const initial = (() => {
    const t = getTheme();
    return (!t || t === "light") ? "dark" : t;
  })();

  const [theme, setThemeState] = useState(initial);

  useEffect(() => { applyTheme(theme); }, [theme]);

  function applyTheme(v){
    const value = (!v || v === "light") ? "dark" : v; // حماية إضافية
    const root = document.documentElement;
    root.classList.toggle("dark", value === "dark");
    root.setAttribute("data-theme", value);
    setTheme(value);
  }

  return (
    <FancySelect
      value={theme}
      onChange={(v) => setThemeState((!v || v === "light") ? "dark" : v)}
      options={options}
      width="w-42"
    />
  );
}

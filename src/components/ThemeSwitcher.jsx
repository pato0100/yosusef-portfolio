// src/components/ThemeSwitcher.jsx
import { useEffect, useState } from "react";
import FancySelect from "./FancySelect";
import { getTheme, setTheme as persistTheme } from "../utils/storage";
import { THEME_OPTIONS, isValidTheme } from "../data/themes";

// ✅ خليه يقبل defaultTheme اختياري + onChangeTheme (اختياري)
export default function ThemeSwitcher({ defaultTheme = "agogovich", onChangeTheme }) {
  // الأولوية: LocalStorage → defaultTheme (من Settings) → "dark"
  const initial = (() => {
    const stored = getTheme();
    const candidate = stored || defaultTheme || "dark";
    // أي قيمة فاضية أو light تتحول لـ dark، ونتأكد إنها من اللستة
    if (!candidate || candidate === "light") return "dark";
    return isValidTheme(candidate) ? candidate : "dark";
  })();

  const [theme, setThemeState] = useState(initial);

  useEffect(() => { applyTheme(theme); }, [theme]);

  function applyTheme(v) {
    const value = (!v || v === "light") ? "dark" : v;
    const root = document.documentElement;
    root.classList.toggle("dark", value === "dark");
    root.setAttribute("data-theme", value);
    persistTheme(value);           // خزّن في LocalStorage
    onChangeTheme?.(value);        // بلّغ الأب (اختياري)
  }

  return (
    <FancySelect
      value={theme}
      onChange={(v) => setThemeState((!v || v === "light") ? "dark" : v)}
      options={THEME_OPTIONS}
      width="w-42"
    />
  );
}

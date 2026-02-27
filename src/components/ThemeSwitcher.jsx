// src/components/ThemeSwitcher.jsx
import { useEffect, useState } from "react";
import FancySelect from "./FancySelect";
import { setTheme as persistTheme } from "../utils/storage";
import { THEME_OPTIONS, isValidTheme } from "../data/themes";

export default function ThemeSwitcher({ defaultTheme, onChangeTheme }) {
  const [theme, setThemeState] = useState("agogovich");

  // لما App يبعث الثيم من Supabase
  useEffect(() => {
    if (defaultTheme && isValidTheme(defaultTheme)) {
      setThemeState(defaultTheme);
    }
  }, [defaultTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function applyTheme(value) {
    const root = document.documentElement;
    root.classList.toggle("dark", value === "dark");
    root.setAttribute("data-theme", value);
    persistTheme(value);
    onChangeTheme?.(value);
  }

  return (
    <FancySelect
      value={theme}
      onChange={(v) => {
        if (isValidTheme(v)) setThemeState(v);
      }}
      options={THEME_OPTIONS}
      width="w-42"
    />
  );
}
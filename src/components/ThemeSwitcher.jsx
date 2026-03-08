import { useEffect, useState } from "react";
import FancySelect from "./FancySelect";
import { setTheme as persistTheme } from "../utils/storage";
import { THEME_OPTIONS, isValidTheme } from "../data/themes";

export default function ThemeSwitcher({ defaultTheme, onChangeTheme }) {
  const [theme, setThemeState] = useState(
    defaultTheme && isValidTheme(defaultTheme) ? defaultTheme : "agogovich"
  );

  useEffect(() => {
    if (defaultTheme && isValidTheme(defaultTheme)) {
      setThemeState(defaultTheme);
    }
  }, [defaultTheme]);

  function applyTheme(value) {
    const root = document.documentElement;
    root.classList.toggle("agogovich", value === "agogovich");
    root.setAttribute("data-theme", value);
    persistTheme(value);
    onChangeTheme?.(value);
  }

  return (
    <FancySelect
      value={theme}
      onChange={(v) => {
        if (!isValidTheme(v)) return;
        setThemeState(v);
        applyTheme(v);
      }}
      options={THEME_OPTIONS}
      width="w-42"
    />
  );
}
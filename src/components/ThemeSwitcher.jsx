export default function ThemeSwitcher({ defaultTheme = "agogovich", onChangeTheme }) {

  const initial = isValidTheme(defaultTheme) ? defaultTheme : "dark";
  const [theme, setThemeState] = useState(initial);

  useEffect(() => {
    if (defaultTheme && defaultTheme !== theme) {
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
      onChange={(v) => setThemeState(v)}
      options={THEME_OPTIONS}
      width="w-42"
    />
  );
}
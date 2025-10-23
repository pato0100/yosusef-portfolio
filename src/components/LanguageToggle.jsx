import FancySelect from "./FancySelect";
import { useI18n } from "../i18n/i18n";

const langs = [
  { value: "en", label: "English" },
  { value: "ar", label: " العربية" },
];

export default function LanguageToggle(){
  const { lang, setLang } = useI18n();
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <FancySelect
      value={lang}
      onChange={setLang}
      options={langs}
      width="w-36"
      dir={dir}
    />
  );
}

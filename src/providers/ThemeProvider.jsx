import { useEffect, createContext, useContext, useState } from "react"
import { getSettings } from "../services/settings"

const ThemeContext = createContext()

export function ThemeProvider({ slug, children }) {

const [settings,setSettings] = useState(null)

useEffect(()=>{

async function loadTheme(){

if(!slug) return

const data = await getSettings(slug)

setSettings(data)

const root = document.documentElement

root.setAttribute(
"data-theme",
data?.defaultTheme ?? "dark"
)

if(data?.defaultTheme === "custom" && data.custom_theme){

root.style.setProperty("--custom-brand",data.custom_theme.brand)
root.style.setProperty("--custom-bg",data.custom_theme.background)
root.style.setProperty("--custom-card",data.custom_theme.card)
root.style.setProperty("--custom-text",data.custom_theme.text)

}

}

loadTheme()

},[slug])

return (
<ThemeContext.Provider value={settings}>
{children}
</ThemeContext.Provider>
)

}

export function useTheme(){
return useContext(ThemeContext)
}
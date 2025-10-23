/** @type {import('tailwindcss').Config} */
export default {
darkMode: 'class',
content: [
'./index.html',
'./src/**/*.{js,jsx,ts,tsx}',
],
theme: {
extend: {
fontFamily: {
// choose a clean pairing; you can change to Cairo if you prefer
sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Cairo', 'Arial', 'sans-serif'],
},
colors: {
brand: {
50: '#ebf8ff', 100: '#d1f0ff', 200: '#a8e3ff', 300: '#7ad3ff',
400: '#4ac1ff', 500: '#1eaafc', 600: '#0a8fdc', 700: '#0b77b7',
800: '#0f5f90', 900: '#0f4f74'
}
}
},
},
plugins: [],
}
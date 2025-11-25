/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Color Palette
        'brand': {
          'neutral': '#FFFFFF',      // Crisp White - Dominant background
          'primary': '#7D633C',      // Dark Gold/Bronze - Headings, logo, branding
          'cta': '#FF6B6B',          // Vibrant Coral - CTAs, buttons, interactive elements
          'accent': '#1a4f62',       // Deep Teal/Navy - Section banners, icons, containers
          'accent-dark': '#0F2E42',  // Darker variant for better text contrast
        },
      },
    },
  },
  plugins: [],
}


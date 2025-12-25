import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFEF9',      // warm cream — replace cold blue bg
        surface: '#FFFFFF',         // card backgrounds
        border: '#E8E6E1',          // subtle warm gray
        text: {
          primary: '#1A1A1A',
          secondary: '#6B6B6B',
          muted: '#9B9B9B',
        },
        accent: {
          DEFAULT: '#E8655A',       // coral — primary buttons, date
          hover: '#D4524A',
          light: '#FDF2F1',         // coral tint for backgrounds
        },
        tag: {
          bg: '#F4F4F2',
          text: '#5C5C5C',
        }
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

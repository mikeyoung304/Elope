/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Lavender/Purple palette matching elopetomaconga.com aesthetic
        lavender: {
          50: '#F5F6FA',   // Lightest - almost white with subtle lavender
          100: '#ECEEF5',  // Very light lavender
          200: '#E0E3EE',  // Light lavender - main background tone
          300: '#D5D8E8',  // Soft lavender - secondary background
          400: '#C5C9DD',  // Medium lavender
          500: '#B0B5D0',  // Standard lavender
          600: '#9198BE',  // Deeper lavender
          700: '#7179A3',  // Dark lavender
          800: '#5A608A',  // Very dark lavender
          900: '#464B6F',  // Darkest lavender
        },
        navy: {
          50: '#F1F2F6',   // Lightest navy tint
          100: '#E3E5EB',  // Very light navy
          200: '#C7CAD7',  // Light navy
          300: '#A3A8BE',  // Medium-light navy
          400: '#7E84A0',  // Medium navy
          500: '#5A6082',  // Standard navy
          600: '#4A4E69',  // Deep navy - primary text
          700: '#3D405B',  // Darker navy - emphasis text
          800: '#30334D',  // Very dark navy
          900: '#24263F',  // Darkest navy
        },
        purple: {
          50: '#F5F3F9',   // Lightest purple
          100: '#EBE7F3',  // Very light purple
          200: '#D7CFE7',  // Light purple
          300: '#C3B7DB',  // Medium-light purple
          400: '#A593C9',  // Medium purple
          500: '#8770B7',  // Standard purple - accent
          600: '#6F5B9A',  // Deep purple
          700: '#58477D',  // Darker purple
          800: '#413460',  // Very dark purple
          900: '#2B2343',  // Darkest purple
        },
        // Semantic color tokens - DARK THEME
        primary: {
          DEFAULT: '#8770B7',  // Purple 500 - primary accent/buttons
          foreground: '#FFFFFF', // White text on primary
        },
        secondary: {
          DEFAULT: '#3D405B',  // Navy 700 - secondary elements on dark bg
          foreground: '#F5F6FA', // Lavender 50 - light text on secondary
        },
        muted: {
          DEFAULT: '#30334D',  // Navy 800 - muted dark backgrounds
          foreground: '#C7CAD7', // Navy 200 - muted light text
        },
        accent: {
          DEFAULT: '#A593C9',  // Purple 400 - lighter accent for dark bg
          foreground: '#FFFFFF', // White text on accent
        },
        border: '#5A6082',     // Navy 500 - visible borders on dark bg
        input: '#3D405B',      // Navy 700 - dark input backgrounds
        background: '#30334D', // Navy 800 - DARK navy background
        foreground: '#F5F6FA', // Lavender 50 - LIGHT text (white/off-white)
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        // Typography scale - ENHANCED for better readability
        'hero': ['72px', { lineHeight: '1.15', fontWeight: '700' }],
        'h1': ['60px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['48px', { lineHeight: '1.25', fontWeight: '700' }],
        'h3': ['32px', { lineHeight: '1.3', fontWeight: '700' }],
        'subtitle': ['22px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        DEFAULT: '10px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'subtle': '0 2px 4px rgba(0, 0, 0, 0.2)',
        'elegant': '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'lifted': '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
      },
      transitionDuration: {
        DEFAULT: '300ms',
      },
    },
  },
  plugins: [],
}

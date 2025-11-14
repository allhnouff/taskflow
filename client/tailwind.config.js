/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#FACC15', // Primary Dark Yellow
          500: '#FCD34D', // Primary Yellow
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          DEFAULT: '#FCD34D', // Primary Yellow
        },
        // Priority colors
        priority: {
          high: '#DC2626',    // Danger (High Priority)
          medium: '#D97706',  // Medium Priority
          low: '#65A30D',     // Low Priority
        },
        // Status colors
        status: {
          inProgress: '#FBBF24',  // In Progress Label
          notStarted: '#9CA3AF',  // Not Started Label
        },
        // Text colors
        text: {
          primary: '#1F1F1F',     // Black / Text
          muted: '#6B7280',       // Muted Text
        },
        // Border colors
        border: {
          gray: '#E5E7EB',        // Gray (Borders / Labels)
        },
        // Cream & Brown theme colors
        cream: {
          DEFAULT: '#F8F7F3',
          light: '#FAFAF8',
          input: '#F5F4F0',
        },
        brown: {
          DEFAULT: '#5C4033',
          dark: '#3D2817',
          light: '#8B6F47',
        },
        tan: {
          DEFAULT: '#D2B48C',
          light: '#E6D5B8',
        },
        // Semantic color aliases using primary theme
        accent: {
          DEFAULT: '#FCD34D',  // Primary Yellow
          light: '#fef08a',
          dark: '#FACC15',     // Primary Dark Yellow
        },
      },
      backgroundColor: {
        'app': '#F8F7F3',
        'card': '#ffffff',
        'login-cream': '#F8F7F3',
      },
      textColor: {
        'primary': '#5C4033',
        'secondary': '#374151',
        'muted': '#6b7280',
        'brown': '#5C4033',
      },
      borderColor: {
        'light': '#e5e7eb',
        'medium': '#d1d5db',
      },
      fontFamily: {
        'serif': ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}


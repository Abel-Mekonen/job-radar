/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1a73e8',
          'blue-hover': '#1557b0',
          'blue-light': '#e8f0fe',
          'blue-border': '#d2e3fc',
          bg: '#ffffff',
          surface: '#f8fafd',
          hover: '#f1f3f4',
          border: '#dadce0',
          divider: '#e0e0e0',
          text: '#3c4043',
          heading: '#202124',
          muted: '#5f6368',
          subtle: '#70757a',
          // Event Colors matching Google Calendar
          green: '#137333',
          'green-light': '#ceead6',
          red: '#c5221f',
          'red-light': '#fce8e6',
          amber: '#e37400',
          'amber-light': '#feefe3',
          purple: '#8430ce',
          'purple-light': '#f3e8fd',
          teal: '#007b83',
          'teal-light': '#cbf0f8',
        },
      },
      fontFamily: {
        google: ['"Google Sans"', 'Roboto', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        'google-card': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'google-modal': '0 24px 38px 3px rgba(60,64,67,0.14), 0 9px 46px 8px rgba(60,64,67,0.12), 0 11px 15px -7px rgba(60,64,67,0.2)',
        'google-btn': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'google-hover': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
      },
    },
  },
  plugins: [],
};

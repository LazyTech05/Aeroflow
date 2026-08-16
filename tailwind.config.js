/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0C10',
        surface: '#15151A',
        surfaceHover: '#1E1E24',
        borderSubtle: 'rgba(255, 255, 255, 0.05)',
        brand: '#3B82F6', // Bright Blue
        brandHover: '#2563EB',
      },
      boxShadow: {
        'top-glow-blue': 'inset 0 1px 0 0 rgba(59, 130, 246, 0.4), 0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'top-glow-green': 'inset 0 1px 0 0 rgba(16, 185, 129, 0.4), 0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'top-glow-purple': 'inset 0 1px 0 0 rgba(139, 92, 246, 0.4), 0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'radial-gradient-subtle': 'radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
      }
    },
  },
  plugins: [],
}

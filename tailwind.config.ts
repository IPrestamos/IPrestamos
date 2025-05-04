import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#0e0e13",
      },
      animation: {
        "border-flow": "border-animation 4s linear infinite",
      },
      boxShadow: {
        glow: "0 0 10px rgba(255, 73, 219, 0.7), 0 0 20px rgba(139, 92, 246, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config; 
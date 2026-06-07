import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        olive: {
          DEFAULT: '#6B7C3F',   // 메인 브랜드 컬러
          light:   '#8FA456',   // 호버, 강조
          pale:    '#D4DBA8',   // 배경, 카드 배경
          dark:    '#3D4A22',   // 헤더, 다크 텍스트
        },
        accent:  '#C8B84A',     // 골드 올리브 — 포인트, 강조 배지
        neutral: '#F7F6F1',     // 배경 오프화이트
        'olive-gray': '#6B6B6B', // 보조 텍스트
      },
      fontFamily: {
        pretendard: ["var(--font-pretendard)", "Pretendard", "sans-serif"],
        serifDisplay: ["var(--font-serif-display)", "DM Serif Display", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;

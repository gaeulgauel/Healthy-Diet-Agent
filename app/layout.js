import "./globals.css";

export const metadata = {
  title: "식단 Agent · AI 건강 식단 분석",
  description: "오늘 먹은 음식을 입력하면 AI가 영양을 분석하고 식단 개선을 도와드립니다.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

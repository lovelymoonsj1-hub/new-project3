import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "세특 스튜디오 | 과목별 세특 초안 작성기",
  description:
    "학생 활동 키워드와 관찰 내용을 바탕으로 과목별 세부능력 및 특기사항 초안을 작성합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

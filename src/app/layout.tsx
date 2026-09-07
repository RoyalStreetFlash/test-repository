import type { Metadata } from "next";
import Script from "next/script";
import "../style.css"; 
// ▼ 修正: SnowBackground ではなく BackgroundManager を読み込む
import BackgroundManager from "@/components/BackgroundManager";

export const metadata: Metadata = {
  title: "Live Leciel Log (React)",
  description: "Identity Archive Portal Site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <Script 
          src="https://cdn.tailwindcss.com" 
          strategy="beforeInteractive"
        />
      </head>
      
      {/* 
        body背景色を黒に指定。キャンドルや雪の背景は
        BackgroundManager の中で全画面表示されます。
      */}
      <body className="bg-[#000000]">
        <BackgroundManager />
        {children}
      </body>
    </html>
  );
}
/**
 * src/app/not-found.tsx
 * 存在しないパスへアクセスした際に表示する 404 エラー画面です。
 * * 【Next.js移行に伴う修正】
 * - 独自の History API 操作（navigateTo, CustomLink）をすべて撤廃しました。
 * - Next.js標準の高速な <Link> コンポーネントに差し替えました。
 * - ファイル名（not-found.tsx）の規則に合わせ、`export default` で出力するように変更しました。
 */

import React from 'react';
import Link from 'next/link'; // 🔴 Next.jsの高速リンクコンポーネント

export default function NotFoundPage() { // 🔴 Next.jsの規約に従い `export default` に変更
  return (
    <div className="flex flex-col items-center justify-center h-full mt-32 z-10 text-center animate-in zoom-in duration-300">
      {/* エラーコード表示 */}
      <h1 className="text-6xl font-bold text-[#1abc9c] mb-4 tracking-tighter text-white">404</h1>
      
      {/* 補足メッセージ */}
      <p className="text-xl mb-8 font-bold text-gray-400">Page Not Found</p>
      
      {/* ポータル画面への戻り導線（🔴 Linkコンポーネントへ差し替え） */}
      <Link 
        href="/" 
        className="text-white border-b border-white pb-1 hover:text-[#1abc9c] transition-colors"
      >
        Identity Portal に戻る
      </Link>
    </div>
  );
}
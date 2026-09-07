"use client";

/**
 * src/app/page.tsx
 * メインのポータル画面（Identity Portal）です。
 * 高速遷移（Link）で戻ってきた時も100%ガタつかず、一発でパッと表示される完全版です。
 */

import React, { useState, useEffect } from 'react'; // 🔴 状態管理用のフックを追加

export default function Home() {
  /**
   * ナビゲーション制御
   */
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  // 🔴 【データ露出・ガタつき防止システム】
  // メイン画面が開かれ、ReactとTailwindの準備が100%整ったか監視するポケットです。
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // 画面の準備が完全に終わったら true にする（高速ワープ時も確実に発発動します）
  }, []);

  // 🔴 準備が終わるまでの数ミリ秒間は何も画面に出さず、夜空と雪だけをキープします。
  if (!mounted) {
    return null;
  }

  return (
    /* 🔴 【横幅間延びの絶対防衛線】
            ライブ画面と同様に、500px幅のインラインスタイルを直接焼き付けました。
            これでどんな大画面PCで見ても、引き伸ばされずに美しいスマホサイズが維持されます。
    */
    <div id="app" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
      
      {/* 旧 SCREEN_CONTAINER のTailwindクラス構造をそのまま100%復元 */}
      <div className="flex flex-col items-center justify-center h-full mt-20 z-10 animate-in fade-in duration-500">
        
        {/* サービスタイトル */}
        <h1 className="text-5xl font-black mb-2 text-center tracking-tighter text-white">
          IDENTITY LOG
        </h1>
        <p className="text-gray-400 text-center mb-12 text-sm tracking-widest uppercase">
          Portal Menu
        </p>
        
        {/* 旧 CARD_SPACING のTailwindクラス構造（カードの隙間と左右余白） */}
        <div className="space-y-4 w-full px-4">
          
          {/* Live参戦 記録パス修正 */}
          <div 
            onClick={() => navigateTo("/archive-demo")} 
            className="block w-full bg-[#0d1117] border border-gray-700 hover:border-[#1abc9c] p-6 rounded-2xl shadow-xl transition-all cursor-pointer group text-left"
          >
            <h2 className="text-xl font-bold text-white group-hover:text-[#1abc9c] transition-colors">
              Live参戦 記録
            </h2>
            <p className="text-xs text-gray-500 mt-2">
              ライブの参戦記録と画像生成
            </p>
          </div>

          {/* プロフィールカード */}
          <div 
            onClick={() => navigateTo("/profile")} 
            className="block w-full bg-[#0d1117] border border-gray-700 hover:border-[#1abc9c] p-6 rounded-2xl shadow-xl transition-all cursor-pointer group text-left"
          >
            <h2 className="text-xl font-bold text-white group-hover:text-[#1abc9c] transition-colors">
              プロフィールカード
            </h2>
            <p className="text-xs text-gray-500 mt-2">
              あなたの好みを教えて♡
            </p>
          </div>

          {/* プロフィールラベル */}
          <div 
            onClick={() => navigateTo("/profile-label")} 
            className="block w-full bg-[#0d1117] border border-gray-700 hover:border-[#1abc9c] p-6 rounded-2xl shadow-xl transition-all cursor-pointer group text-left"
          >
            <h2 className="text-xl font-bold text-white group-hover:text-[#1abc9c] transition-colors">
              プロフィールラベル
            </h2>
            <p className="text-xs text-gray-500 mt-2">
              このみで生成できる
            </p>
          </div>

          {/* 開発予定エリア（プレースホルダ） */}
          <div className="block w-full bg-[#0d1117]/50 border border-gray-800 p-6 rounded-2xl shadow-inner opacity-50 cursor-not-allowed text-left">
            <h2 className="text-xl font-bold text-gray-500">
              Other Features
            </h2>
            <p className="text-xs text-gray-600 mt-2">
              Coming Soon...
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
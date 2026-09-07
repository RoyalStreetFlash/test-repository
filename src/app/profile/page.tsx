"use client"; // 🔴 ブラウザ側（クライアント）で動作させるための必須宣言

/**
 * src/app/profile/page.tsx
 * コミカルでポップなアメコミ風デザインをテーマにした、プロフィール名刺作成ページコンポーネントです。
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; // Next.jsの高速リンクコンポーネント
import html2canvas from 'html2canvas'; // 直接インポート
import QRCode from 'qrcode'; // 直接インポート

export default function ProfilePage() { 
  // --- 状態管理 (State) ---
  
  // ユーザーがアップロードしたアイコン画像（DataURL）
  const [userIcon, setUserIcon] = useState<string | null>(null);
  
  // プロフィール入力項目
  const [profile, setProfile] = useState({
    name: '',
    gender: '',
    residence: '',
    music: '',
    anime: '',
    game: '',
    hobby: '',
    freespace: ''
  });

  // 画像生成中フラグ（連打防止）
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  // 生成された画像のプレビュー用URL
  const [modalImage, setModalImage] = useState<string | null>(null);

  // 🔴 【データ露出・ガタつき防止システム】
  // ブラウザ側でReactとTailwindの準備が100%整ったか監視するポケット（フラグ）です。
  const [mounted, setMounted] = useState(false);

  // 🔴 画面が開いた最初の1回だけ実行され、完全起動を検知してポケットを true にします。
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- 参照 (Refs) ---
  const fileInputRef = useRef<HTMLInputElement | null>(null); // ファイル選択用
  const qrRef = useRef<HTMLCanvasElement | null>(null);      // QR描画キャンバス用
  const exportRef = useRef<HTMLDivElement | null>(null);    // 画像化する隠しエリア用

  // --- QRコードの再描画 ---
  useEffect(() => {
    if (qrRef.current) {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      QRCode.toCanvas(qrRef.current, currentUrl, { width: 50, margin: 1 })
        .catch(err => console.error("QRコード生成エラー:", err));
    }
  }, [profile]);

  // --- イベントハンドラ ---
  const handleInputChange = (field: keyof typeof profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setUserIcon(ev.target.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (exportRef.current) {
        const canvas = await html2canvas(exportRef.current, { 
          scale: 2,           // 高解像度で書き出し
          backgroundColor: null, 
          useCORS: true       // 外部画像の読み込みを許可
        });
        setModalImage(canvas.toDataURL('image/png'));
      }
    } catch (e) {
      console.error("画像生成エラー:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔴 準備が完了するまでの数ミリ秒間は、画面に1文字も出力しません。
  // これにより、起動時に一瞬アメコミ風のすっぴんデータが上に露出するバグを物理的に不可能な状態にします。
  if (!mounted) {
    return null; 
  }

  return (
    /* 🔴 【横幅間延び・ガタつきの完全ねじ伏せ】
            あなたのオリジナルの style.css と連携させつつ、Tailwind CDNの上書き暴走に競り勝つために、
            最外殻を <div id="app"> で包み、最強の優先度を持つ500px幅インラインスタイルを直接焼き付けました。
    */
    <div id="app" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
      <div className="flex flex-col items-center w-full z-10 pt-4 pb-12 animate-in slide-in-from-bottom duration-500 font-sans">
        
        {/* ナビゲーション */}
        <div className="w-full mb-6 flex justify-start items-center px-1">
          <Link 
            href="/"
            className="group flex items-center gap-2 text-yellow-400 hover:text-pink-400 transition-all duration-300 font-black text-sm drop-shadow-[2px_2px_0_rgba(0,0,0,1)]"
          >
            <span className="transform group-hover:-translate-x-2 transition-transform">◀</span>
            <span>Portal Menu</span>
          </Link>
        </div>

        {/* ヘッダーセクション: アメコミ風の斜め配置タイトル */}
        <header className="text-center mb-8 transform -rotate-2">
          <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tighter text-yellow-400 drop-shadow-[4px_4px_0_rgba(236,72,153,1)]">
            SUPER PROFILE!
          </h1>
        </header>

        {/* 入力フォーム本体: ビビッドな配色と太いボーダー */}
        <div className="w-full flex flex-col bg-[#1a1025] p-6 rounded-3xl border-4 border-cyan-400 shadow-[8px_8px_0_rgba(236,72,153,1)] mb-8 relative overflow-hidden">
          
          {/* 装飾用背景文字 */}
          <div className="absolute -right-8 -top-8 text-8xl font-black opacity-10 text-yellow-400 pointer-events-none select-none transform rotate-12">
            GENIUS!
          </div>

          {/* アイコン選択 & 基本プロフィール入力 */}
          <div className="flex gap-4 mb-6 relative z-10">
            <div className="w-24 flex-shrink-0 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <div className="w-full aspect-square bg-white/10 border-4 border-dashed border-yellow-400 rounded-full flex items-center justify-center overflow-hidden group-hover:scale-105 group-hover:rotate-6 transition-all shadow-inner">
                {userIcon ? (
                  <img src={userIcon} className="w-full h-full object-cover" alt="Icon" />
                ) : (
                  <span className="text-2xl">📸</span>
                )}
              </div>
            </div>
            <div className="flex-grow flex flex-col justify-end gap-3">
              <input type="text" value={profile.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="NAME (名前)" 
                className="w-full bg-black/40 border-2 border-cyan-400/50 rounded-lg px-3 py-2 text-xl font-black text-white focus:border-yellow-400 focus:bg-black/60 outline-none transition-colors placeholder-gray-500" />
              <div className="flex gap-2">
                <input type="text" value={profile.gender} onChange={e => handleInputChange('gender', e.target.value)} placeholder="GENDER (性別)" 
                  className="w-1/2 bg-black/40 border-2 border-cyan-400/50 rounded-lg px-3 py-1 text-sm font-bold text-gray-200 focus:border-yellow-400 outline-none transition-colors placeholder-gray-500" />
                <input type="text" value={profile.residence} onChange={e => handleInputChange('residence', e.target.value)} placeholder="RESIDENCE (住み)" 
                  className="w-1/2 bg-black/40 border-2 border-cyan-400/50 rounded-lg px-3 py-1 text-sm font-bold text-gray-200 focus:border-yellow-400 outline-none transition-colors placeholder-gray-500" />
              </div>
            </div>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleIconChange} />

          {/* 詳細項目リスト: 好きなものシリーズ */}
          <div className="space-y-4 relative z-10">
            {[
              { key: 'music', label: '🎧 Favorite Music' },
              { key: 'anime', label: '📺 Favorite Anime' },
              { key: 'game', label: '🎮 Favorite Game' },
              { key: 'hobby', label: '🎨 Hobby & Interests' },
            ].map(item => (
              <div key={item.key} className="bg-black/30 p-3 rounded-2xl border-2 border-pink-500/50 hover:border-pink-400 transition-colors">
                <label className="text-[10px] text-yellow-300 font-black uppercase tracking-widest block mb-1 drop-shadow-md">{item.label}</label>
                <textarea value={profile[item.key as keyof typeof profile]} onChange={e => handleInputChange(item.key as keyof typeof profile, e.target.value)} rows={2}
                  className="w-full bg-transparent text-sm font-bold text-white outline-none resize-none custom-scrollbar placeholder-gray-600 leading-relaxed" placeholder="..." />
              </div>
            ))}
            <div className="bg-black/30 p-3 rounded-2xl border-2 border-cyan-400/50 hover:border-cyan-400 transition-colors">
              <label className="text-[10px] text-cyan-300 font-black uppercase tracking-widest block mb-1 drop-shadow-md">💬 Free Space</label>
              <textarea value={profile.freespace} onChange={e => handleInputChange('freespace', e.target.value)} rows={3}
                className="w-full bg-transparent text-sm font-bold text-white outline-none resize-none custom-scrollbar placeholder-gray-600 leading-relaxed" placeholder="語りたいことをここにドカンと書け！" />
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-8 flex items-center gap-4 relative z-10">
            <div className="bg-white p-1 rounded-xl border-4 border-yellow-400 shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <canvas ref={qrRef} style={{ width: '50px', height: '50px' }}></canvas>
            </div>
            <button onClick={handleExport} disabled={isProcessing} 
              className="flex-grow bg-yellow-400 text-black border-4 border-black py-4 rounded-2xl font-black tracking-widest shadow-[6px_6px_0_rgba(236,72,153,1)] hover:bg-yellow-300 hover:translate-y-1 hover:shadow-[2px_2px_0_rgba(236,72,153,1)] active:scale-95 transition-all disabled:opacity-50">
              {isProcessing ? 'Generating... 🌀' : '✨ バーンと画像を生成 ✨'}
            </button>
          </div>
        </div>

        {/* 生成結果プレビューモーダル */}
        {modalImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300" onClick={() => setModalImage(null)}>
            <div className="w-full max-w-sm transform rotate-2 animate-in slide-in-from-bottom-10 duration-500">
              <img src={modalImage} className="w-full rounded-2xl border-4 border-white shadow-[10px_10px_0_rgba(236,72,153,1)] mb-6" alt="Generated Profile" />
            </div>
            <p className="text-yellow-400 text-sm font-black mb-8 uppercase tracking-widest text-center bg-black/50 px-4 py-2 rounded-full border-2 border-yellow-400">
              👇 画像を長押しして保存だ！ 👇
            </p>
            <button className="w-full max-w-[240px] bg-cyan-400 text-black border-4 border-black py-3 rounded-full font-black tracking-widest hover:bg-cyan-300 active:scale-95 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]">
              CLOSE (閉じる)
            </button>
          </div>
        )}

        {/* 【画像エクスポート用オフスクリーン領域】 */}
        <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
          <div ref={exportRef} className="w-[375px] min-h-[667px] bg-[#1a1025] p-6 relative overflow-hidden font-sans border-8 border-yellow-400">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ec4899 15%, transparent 16%)', backgroundSize: '20px 20px' }}></div>
            <div className="absolute -right-4 -top-4 w-40 h-40 bg-cyan-400 rounded-full blur-[40px] opacity-50"></div>
            <div className="absolute -left-10 top-1/2 text-8xl font-black text-pink-500/20 -rotate-90 origin-left tracking-widest whitespace-nowrap">AWESOME</div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-6 mb-8 bg-black/40 p-4 rounded-3xl border-4 border-pink-500 shadow-[4px_4px_0_rgba(34,211,238,1)] transform -rotate-2">
                {userIcon ? (
                  <div className="w-24 h-24 flex-shrink-0 rounded-full overflow-hidden border-4 border-yellow-400 shadow-inner bg-white">
                    <img src={userIcon} className="w-full h-full object-cover" alt="icon" />
                  </div>
                ) : (
                  <div className="w-24 h-24 flex-shrink-0 rounded-full bg-gray-800 border-4 border-dashed border-yellow-400 flex items-center justify-center">
                    <span className="text-3xl">👤</span>
                  </div>
                )}
                <div className="flex-col">
                  <h2 className="text-3xl font-black text-white m-0 tracking-tight drop-shadow-[2px_2px_0_rgba(236,72,153,1)] leading-tight">{profile.name || 'NO NAME'}</h2>
                  <p className="text-yellow-300 text-xs font-bold uppercase tracking-widest mt-1 bg-black/50 inline-block px-2 py-0.5 rounded-md border border-yellow-400/50">
                    {profile.gender} {profile.gender && profile.residence ? '|' : ''} {profile.residence}
                  </p>
                </div>
              </div>

              <div className="space-y-4 flex-grow pl-2">
                {[
                  { key: 'music', label: '🎧 MUSIC' },
                  { key: 'anime', label: '📺 ANIME' },
                  { key: 'game', label: '🎮 GAME' },
                  { key: 'hobby', label: '🎨 HOBBY' },
                ].map(item => profile[item.key as keyof typeof profile] && (
                  <div key={item.key} className="bg-white/10 p-3 rounded-2xl border-l-8 border-cyan-400 shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                    <p className="text-[10px] text-pink-400 font-black uppercase tracking-widest mb-1 drop-shadow-sm">{item.label}</p>
                    <p className="text-white text-sm font-bold whitespace-pre-wrap leading-relaxed">{profile[item.key as keyof typeof profile]}</p>
                  </div>
                ))}
              </div>

              {profile.freespace && (
                <div className="mt-6 bg-yellow-400 p-4 rounded-3xl border-4 border-black shadow-[6px_6px_0_rgba(236,72,153,1)] transform rotate-1">
                  <p className="text-[10px] text-black font-black uppercase tracking-widest mb-1">💬 FREE SPACE</p>
                  <p className="text-black text-xs font-bold leading-relaxed whitespace-pre-wrap">"{profile.freespace}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
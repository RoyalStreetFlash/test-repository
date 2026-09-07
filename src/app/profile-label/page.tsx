"use client"; // クライアント側（ブラウザ）で動作させるための必須宣言

/**
 * src/app/profile-label/page.tsx
 * 複数の「ラベル」形式でプロフィール情報を入力し、カスタマイズ可能な一枚の画像として出力するスクリーンです。
 */

import { useState, useRef, useEffect } from 'react';

// ============================================================================
// デザイン継承用：背景アニメーション
// 🔴 【エラー根絶のための修正箇所】
// サーバーサイドでの先走り計算を禁止し、ブラウザ起動後に1回だけランダム配置を行います。
// ============================================================================
const SnowBackground = () => {
  // ブラウザ側で準備が100%整ったか監視するポケット
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // 完全に起動が終わったら true にする
  }, []);

  // 準備が整う前（サーバーサイド）は何も出力しません。
  // これにより、サーバーとブラウザで Math.random() が2回計算されて食い違うエラーを根本から防ぎます。
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {[...Array(30)].map((_, i) => (
        <div key={i} className="absolute bg-white rounded-full opacity-40 animate-pulse"
          style={{ 
            width: '2px', 
            height: '2px', 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100}%`, 
            animation: `fall ${Math.random() * 20 + 10}s linear infinite`, 
            animationDelay: `${Math.random() * 10}s` 
          }} />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(110vh); } }`}</style>
    </div>
  );
};

// ============================================================================
// ProfileLabel コンポーネント
// ============================================================================
interface LabelData {
  id: number;       // ユニークID
  title: string;    // ラベルの見出し
  content: string;  // ラベルの内容
  rotation: number; // 描画時の傾き（度）
}

export const ProfileLabel = () => {
  // --- 状態管理 (State) ---
  const [name, setName] = useState('');
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [userIcon, setUserIcon] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  
  // --- 参照 (Refs) ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  // --- 初期化: ライブラリロード ---
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js';
    s.onload = () => setLibsReady(true);
    document.head.appendChild(s);
  }, []);

  // --- QRコードの描画 ---
  useEffect(() => {
    if (libsReady && qrRef.current && (window as any).QRCode) {
      (window as any).QRCode.toCanvas(qrRef.current, window.location.href, { 
        width: 60, 
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
    }
  }, [libsReady]);

  const addLabel = () => {
    const nextId = labels.length + 1;
    const baseAngle = Math.floor(Math.random() * 6) + 5;

    let sign: number;
    if (labels.length === 0) {
      sign = Math.random() > 0.5 ? 1 : -1;
    } else {
      const lastRotation = labels[labels.length - 1].rotation;
      sign = lastRotation > 0 ? -1 : 1;
    }

    const angle = baseAngle * sign;

    setLabels([
      ...labels,
      { id: nextId, title: `FREE SPACE ${nextId}`, content: '', rotation: angle }
    ]);
  };

  const handleLabelChange = (id: number, value: string) => {
    setLabels(prev => prev.map(label => 
      label.id === id ? { ...label, content: value } : label
    ));
  };

  const handleLabelTitleChange = (id: number, value: string) => {
    setLabels(prev => prev.map(label => 
      label.id === id ? { ...label, title: value } : label
    ));
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setUserIcon(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getWrappedLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split('');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const char = words[i];
      if (char === '\n') {
        lines.push(currentLine);
        currentLine = '';
        continue;
      }
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const generateProfileImage = async () => {
    setIsGenerating(true);
    
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
      });
    };

    setTimeout(async () => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      const boxWidth = 840;
      const horizontalPadding = 40;
      const textMaxWidth = boxWidth - (horizontalPadding * 2);
      const lineHeight = 45;
      const boxHeaderHeight = 60;
      const boxFooterPadding = 40;
      const labelSpacing = 60;

      tempCtx.font = 'bold 32px sans-serif';

      const labelLayouts = labels.map(label => {
        const lines = getWrappedLines(tempCtx, label.content || '...', textMaxWidth);
        const contentHeight = lines.length * lineHeight;
        const totalBoxHeight = boxHeaderHeight + contentHeight + boxFooterPadding;
        return { ...label, lines, totalBoxHeight };
      });

      const headerAreaHeight = 420;
      const labelsTotalHeight = labelLayouts.reduce((sum, l) => sum + l.totalBoxHeight + labelSpacing, 0);
      const finalCanvasHeight = Math.max(1080, headerAreaHeight + labelsTotalHeight + 100);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1080;
      canvas.height = finalCanvasHeight;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#000428');
      gradient.addColorStop(1, '#000e4a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 80 + (labels.length * 15); i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PROFILE LABELS', 540, 100);

      const sectionY = 180;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      if (ctx.roundRect) ctx.roundRect(100, sectionY, 880, 160, 30);
      else ctx.rect(100, sectionY, 880, 160);
      ctx.fill();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.lineWidth = 4;
      ctx.stroke();

      if (userIcon) {
        const iconImg = await loadImage(userIcon);
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(130, sectionY + 20, 120, 120, 20);
        else ctx.rect(130, sectionY + 20, 120, 120);
        ctx.clip();
        ctx.drawImage(iconImg, 130, sectionY + 20, 120, 120);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.fillStyle = '#161b22';
        if (ctx.roundRect) ctx.roundRect(130, sectionY + 20, 120, 120, 20);
        else ctx.rect(130, sectionY + 20, 120, 120);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '60px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📸', 190, sectionY + 100);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name || 'GUEST', 280, sectionY + 105);

      let currentY = 420;
      labelLayouts.forEach((label) => {
        ctx.save();
        ctx.translate(540, currentY + (label.totalBoxHeight / 2));
        ctx.rotate((label.rotation * Math.PI) / 180);

        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        if (ctx.roundRect) ctx.roundRect(-boxWidth/2, -label.totalBoxHeight/2, boxWidth, label.totalBoxHeight, 24);
        else ctx.rect(-boxWidth/2, -label.totalBoxHeight/2, boxWidth, label.totalBoxHeight);
        ctx.fill();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#22d3ee';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`💬 ${label.title.toUpperCase()}`, -boxWidth/2 + horizontalPadding, -label.totalBoxHeight/2 + 35);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        label.lines.forEach((line, i) => {
          ctx.fillText(line, -boxWidth/2 + horizontalPadding, -label.totalBoxHeight/2 + 85 + (i * lineHeight));
        });

        ctx.restore();
        currentY += label.totalBoxHeight + labelSpacing;
      });

      const dataUrl = canvas.toDataURL('image/png');
      setModalImage(dataUrl); 
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="w-full flex flex-col gap-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl relative z-10">
      <h2 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 drop-shadow-sm">
        Profile Settings
      </h2>

      <div className="flex flex-col items-center gap-4">
        <div 
          className="relative w-48 h-48 group cursor-pointer" 
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative w-full h-full rounded-2xl border-2 border-cyan-400/30 overflow-hidden bg-black/40 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all shadow-inner">
            {userIcon ? (
              <img src={userIcon} alt="User Icon" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📸</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Click to Upload Icon</span>
              </div>
            )}
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleIconChange} 
        />
        
        <div className="mt-4 flex items-center gap-4 w-full relative z-10">
          <div className="bg-white p-1 rounded-xl shadow-inner flex-shrink-0 border-2 border-cyan-400/30 overflow-hidden">
            <canvas ref={qrRef} style={{ width: '60px', height: '60px' }}></canvas>
          </div>
          
          <div className="flex flex-col flex-grow gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                generateProfileImage();
              }}
              disabled={isGenerating || !libsReady}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg border border-cyan-400/30"
            >
              {isGenerating ? 'Generating... 🌀' : '✨ プロフィール画像作成 ✨'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-black/30 p-3 rounded-2xl border-2 border-white/10 focus-within:border-cyan-400/50 transition-colors">
        <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">
          👤 Name
        </label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="名前を入力..." 
          className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder-gray-600"
        />
      </div>

      <div className="flex flex-col gap-6">
        {labels.map((label) => (
          <div 
            key={label.id}
            style={{ transform: `rotate(${label.rotation}deg)` }}
            className="bg-black/30 p-3 rounded-2xl border-2 border-cyan-400/50 hover:border-cyan-400 transition-colors shadow-lg backdrop-blur-sm"
          >
            <label className="text-[10px] text-cyan-300 font-black uppercase tracking-widest block mb-1 drop-shadow-md">
              💬 Free Space {label.id}
            </label>
            <div className="flex items-center gap-1 mb-1 drop-shadow-md">
              <span className="text-[10px] text-cyan-300">💬</span>
              <input 
                type="text" 
                value={label.title} 
                onChange={e => handleLabelTitleChange(label.id, e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] text-cyan-300 font-black uppercase tracking-widest block w-full p-0 focus:ring-0"
              />
            </div>
            <textarea 
              value={label.content} 
              onChange={e => handleLabelChange(label.id, e.target.value)} 
              onInput={e => {
                const target = e.currentTarget;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              rows={1}
              style={{ minHeight: '80px' }}
              className="w-full bg-transparent text-sm font-bold text-white outline-none resize-none overflow-hidden placeholder-gray-600 leading-relaxed" 
              placeholder="語りたいことをここにドカンと書け！" 
            />
          </div>
        ))}

        {labels.length === 0 && (
          <div className="py-10 text-center text-gray-500 text-sm italic border-2 border-dashed border-white/5 rounded-2xl">
            下のボタンを押して項目を追加
          </div>
        )}
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={addLabel}
          className="w-16 h-16 flex items-center justify-center bg-cyan-400 text-[#000428] rounded-full text-4xl font-black shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-110 hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] transition-all duration-200 active:scale-95"
        >
          +
        </button>
      </div>

      {modalImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[500] flex flex-col items-center p-6 overflow-y-auto pt-10" 
          onClick={() => setModalImage(null)}
        >
          <div className="w-full max-w-sm mb-6 animate-in zoom-in duration-300">
            <img 
              src={modalImage} 
              className="w-full rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.4)] border border-cyan-400/30" 
              alt="Exported Result" 
            />
          </div>
          <p className="text-cyan-400 text-sm mb-8 font-bold opacity-80 text-center animate-pulse">
            画像を長押しして保存、またはシェアしてください
          </p>
          <button 
            className="w-full max-w-[240px] bg-white text-[#000428] py-4 rounded-full font-black tracking-widest shadow-2xl active:scale-95 transition-all mb-10"
            onClick={() => setModalImage(null)}
          >
            CLOSE (閉じる)
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * プレビュー表示用ラッパー
 */
export default function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#000428] text-white p-6 flex flex-col items-center justify-center font-sans relative overflow-x-hidden">
      <SnowBackground />
      
      <div 
        id="app" 
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          margin: '0 auto', 
          position: 'relative', 
          zIndex: 10,
          display: mounted ? 'block' : 'none'
        }}
      >
        {mounted && <ProfileLabel />}
      </div>
    </div>
  );
}
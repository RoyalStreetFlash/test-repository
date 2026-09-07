"use client";

import React, { useEffect, useState } from 'react';

interface CandleProps {
  id: number;
  left: string;
  bottom: string;
  scale: number;
  delay: string;
  flickerDelay: string;
}

export default function CandleBackground() {
  const [candles, setCandles] = useState<CandleProps[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 画面奥（下部〜中央）に広がるように50個のキャンドルをランダム配置
    const generatedCandles = Array.from({ length: 50 }).map((_, i) => {
      // 奥行き感を出すため、上の方（bottomの数値が高い）ほど小さくする
      const bottomVal = Math.random() * 50; // 画面下半分（0% 〜 50%）に配置
      const scale = 1 - (bottomVal / 100) + (Math.random() * 0.3); // 奥ほど小さく、手前ほど大きく

      return {
        id: i,
        left: `${Math.random() * 100}%`,
        bottom: `${bottomVal}%`,
        scale: scale,
        // 0秒〜4秒の間でランダムに「ぽつっ、ぽつっ」と灯るようにする
        delay: `${Math.random() * 4}s`,
        // 炎のゆらめきのタイミングをズラす
        flickerDelay: `${Math.random() * 2}s`
      };
    });

    // 奥行き（scale）が小さいものほど奥になるよう z-index を調整するためソート
    generatedCandles.sort((a, b) => a.scale - b.scale);
    
    setCandles(generatedCandles);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#030005]">
      {/* 幻想的な暗闇と、床を這うようなもや（グラデーション） */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 via-black/80 to-black z-0" />

      {/* キャンドル群 */}
      {candles.map((candle) => (
        <div
          key={candle.id}
          className="absolute flex flex-col items-center opacity-0 animate-lightUp"
          style={{
            left: candle.left,
            bottom: candle.bottom,
            transform: `scale(${candle.scale})`,
            animationDelay: candle.delay,
            animationFillMode: 'forwards',
          }}
        >
          {/* 炎（ゆらめき＋光の拡散） */}
          <div
            className="w-3 h-5 bg-yellow-100 rounded-[50%_50%_20%_20%] animate-flicker"
            style={{
              boxShadow: '0 -2px 10px 4px rgba(255, 165, 0, 0.7), 0 -8px 20px 8px rgba(255, 69, 0, 0.4)',
              animationDelay: candle.flickerDelay,
            }}
          />
          {/* ろうそく本体 */}
          <div className="w-4 h-12 bg-gradient-to-b from-orange-200 via-orange-800 to-transparent rounded-sm mt-0.5 opacity-80" />
        </div>
      ))}

      {/* CSSアニメーション定義 */}
      <style>{`
        /* 順番にフワッと現れる（灯る）アニメーション */
        @keyframes lightUp {
          0% { opacity: 0; transform: translateY(10px) scale(var(--tw-scale-x)); }
          100% { opacity: 1; transform: translateY(0) scale(var(--tw-scale-x)); }
        }

        /* 炎のゆらめきアニメーション */
        @keyframes flicker {
          0%, 100% { transform: scale(1) skewX(0deg); opacity: 0.9; }
          25% { transform: scale(1.1) skewX(1deg); opacity: 1; }
          50% { transform: scale(0.9) skewX(-1deg); opacity: 0.85; }
          75% { transform: scale(1.05) skewX(2deg); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}
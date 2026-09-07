"use client";

import React, { useEffect, useRef } from 'react';
import { fetchLiveListByYear } from '@/services/liveService'; // ライブデータを取得する関数をインポート

interface RowState {
  x: number;
  speed: number;
  direction: 1 | -1;
  text: string;
  charIndex: number;
  frameCount: number;
  color: string;
}

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 取得したデータを保持するためのRef（アニメーションループ内で常に最新値を参照するため）
  const titlesRef = useRef<{ text: string; type: 'artist' | 'song' }[]>([]); 

  // --- 1. 曲名データの非同期取得 ---
  useEffect(() => {
    const loadTitles = async () => {
      try {
        const dataByYear = await fetchLiveListByYear();
        const allLives = Object.values(dataByYear).flat();
        
        // 全ライブデータからアーティスト名とセットリストの曲名を抽出し、それぞれ属性をつけてまとめる
        const allTitles = allLives
          .flatMap(live => {
            // ▼ 修正箇所：setlistが文字列として登録されている場合のエラーを回避するため、配列かどうかを判定
            const songs = Array.isArray(live.setlist) 
              ? live.setlist.map(s => ({ text: s.songTitle, type: 'song' as const })) 
              : [];
            return [{ text: live.artist, type: 'artist' as const }, ...songs];
          })
          .filter(item => item.text && item.text.length > 0);

        if (allTitles.length > 0) {
          titlesRef.current = allTitles; // 取得完了！アニメーション側にデータを渡す
        }
      } catch (e) {
        console.error("Matrix用セットリストの取得に失敗しました", e);
      }
    };
    loadTitles();
  }, []);

  // --- 2. マトリックスアニメーションの描画 ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const fontSize = 18; // 曲名が読みやすいように少し大きめに設定
    const rows = Math.floor(canvas.height / fontSize);

    // テキストと色を決定する関数（未取得時はランダム文字、取得後はアーティスト紫・曲緑）
    const getNextData = () => {
      if (titlesRef.current.length > 0) {
        const items = titlesRef.current;
        const item = items[Math.floor(Math.random() * items.length)];
        return {
          text: item.text + "     ",
          color: item.type === 'artist' ? 'rgb(255, 0, 255)' : '#0F0'
        };
      } else {
        // 【取得前】従来のcmatrix風のランダム文字列を生成
        const chars = 'abcodefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&';
        let rnd = '';
        const len = Math.floor(Math.random() * 8) + 4; // 4〜11文字のランダム
        for (let i = 0; i < len; i++) {
          rnd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return {
          text: rnd + "     ",
          color: Math.random() < 0.7 ? '#0F0' : 'rgb(255, 0, 255)'
        };
      }
    };

    // 各行（横ライン）の初期状態をセット
    const rowStates: RowState[] = Array.from({ length: rows }).map(() => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const data = getNextData();
      return {
        x: direction === 1 ? Math.random() * canvas.width : Math.random() * canvas.width,
        speed: Math.floor(Math.random() * 3) + 1, // タイピング速度のばらつき
        direction,
        text: data.text,
        charIndex: 0,
        frameCount: 0,
        color: data.color
      };
    });

    const draw = () => {
      // 画面全体を薄い黒で塗り潰して「文字の残像」を作る
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 日本語の曲名も綺麗に表示するため sans-serif を指定
      ctx.font = `bold ${fontSize}px sans-serif`; 

      for (let i = 0; i < rowStates.length; i++) {
        const row = rowStates[i];
        const y = (i + 1) * fontSize;

        // 速度コントロール（一定フレームごとに1文字進める）
        row.frameCount++;
        if (row.frameCount < row.speed) continue;
        row.frameCount = 0;

        // ▼ 修正箇所：進行方向が右から左(-1)の場合は、文字列の後ろから描画する
        const char = row.direction === 1 
          ? row.text.charAt(row.charIndex) 
          : row.text.charAt(row.text.length - 1 - row.charIndex);
        
        // 進行方向にあわせてテキストの描画基準点を変える（重なり防止）
        ctx.textAlign = row.direction === 1 ? 'left' : 'right';
        
        // 描画（1文字ずつ書き足していくことで、尾を引くマトリックス感を演出）
        ctx.fillStyle = row.color;
        ctx.fillText(char, row.x, y);

        // 次の文字を描くために、描画した文字の横幅分だけX座標を進める
        const charWidth = ctx.measureText(char).width || fontSize;
        row.x += (charWidth + 2) * row.direction; // +2 は文字同士のわずかな隙間
        row.charIndex++;

        // 1つの文字列（曲名やランダム文字）を描き終えたら次をセット
        if (row.charIndex >= row.text.length) {
          const data = getNextData();
          row.text = data.text;
          row.charIndex = 0;
          row.color = data.color;
        }

        // 画面外（右端または左端）を完全に超えたら、ランダムなタイミングで反対側からリセット
        if (row.direction === 1 && row.x > canvas.width && Math.random() > 0.95) {
          row.x = 0;
          row.direction = Math.random() > 0.5 ? 1 : -1;
          const data = getNextData();
          row.text = data.text;
          row.charIndex = 0;
          row.color = data.color;
        } else if (row.direction === -1 && row.x < 0 && Math.random() > 0.95) {
          row.x = canvas.width;
          row.direction = Math.random() > 0.5 ? 1 : -1;
          const data = getNextData();
          row.text = data.text;
          row.charIndex = 0;
          row.color = data.color;
        }
      }
    };

    // 33ms間隔で描画（約30fps）
    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []); // titlesRef は Ref なので依存配列には不要

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 bg-black"
    />
  );
}
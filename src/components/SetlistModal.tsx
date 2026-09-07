// src/components/SetlistModal.tsx

'use client';

import type { LiveDetail } from '@/types/live';

interface SetlistModalProps {
  live: LiveDetail;
  onClose: () => void;
}

export default function SetlistModal({ live, onClose }: SetlistModalProps) {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      {/* モーダル本体：黒ベースに変更 */}
      <div className="bg-[#0d1117] border border-white/20 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        
        {/* ヘッダー */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
          <div>
            {/* ▼ 修正箇所：タイトル、日付、会場を緑色（#0F0）に変更 ▼ */}
            <h2 className="font-bold text-lg text-[#0F0] line-clamp-1">{live.tourName}</h2>
            <p className="text-xs text-[#0F0] mt-1">{live.date} @ {live.venue}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-[#0F0] p-2 text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* セットリスト内容 (スクロール可能) */}
        {/* ▼ 修正箇所：黒ベースのカスタムスクロールバークラス（custom-modal-scrollbar）を付与 ▼ */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#0d1117] custom-modal-scrollbar">
          <h3 className="text-sm font-semibold text-white mb-3 border-b border-white/20 pb-2">セットリスト</h3>
          
          {Array.isArray(live.setlist) && live.setlist.length > 0 ? (
            <ul className="space-y-3">
              {live.setlist.map((item) => (
                <li key={item.songOrder} className="flex items-baseline">
                  {/* ▼ 修正箇所：曲名等の基本テキストは「白」に戻す ▼ */}
                  <span className="w-8 text-right text-gray-500 text-sm mr-4">{item.songOrder}.</span>
                  <span className="text-white font-medium tracking-wide">{item.songTitle}</span>
                </li>
              ))}
            </ul>
          ) : typeof live.setlist === 'string' ? (
            // ▼ 追加箇所：セットリストが文字列として登録されている場合の分岐 ▼
            <div className="text-center py-8 space-y-4">
              <p className="text-[#0F0] font-bold text-2xl tracking-widest">COMING SOON!!!!!</p>
              <p className="text-white font-medium tracking-wide">{live.setlist}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">セットリストが登録されていません。</p>
          )}

          {/* ▼ 追加箇所：メモ欄（データが存在する場合のみ表示） ▼ */}
          {live.memo && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white mb-3 border-b border-white/20 pb-2">メモ</h3>
              <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                {live.memo}
              </p>
            </div>
          )}
          {/* ▲ 追加箇所ここまで ▲ */}
        </div>
        
        {/* フッター */}
        <div className="p-4 border-t border-white/10 bg-black/50 text-center">
          {/* ▼ 修正箇所：閉じるボタンを緑色（#0F0）ベースに変更 ▼ */}
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-transparent border border-[#0F0] text-[#0F0] rounded-lg hover:bg-[#0F0] hover:text-black transition-all text-sm font-bold tracking-widest"
          >
            閉じる
          </button>
        </div>
      </div>

      {/* スクロールバーを黒ベースにするためのカスタムスタイル */}
      <style>{`
        .custom-modal-scrollbar::-webkit-scrollbar { 
          width: 8px; 
          background: #000; /* 背景を黒に */
        }
        .custom-modal-scrollbar::-webkit-scrollbar-thumb { 
          background: #333; /* つまみをダークグレーに */
          border-radius: 4px; 
          border: 1px solid #000;
        }
        .custom-modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0F0; /* マウスを乗せた時だけ緑に光る遊び心 */
        }
      `}</style>
    </div>
  );
}
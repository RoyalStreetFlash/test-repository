// workspaceProfile/my-app/src/app/archive-demo/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLiveLog } from '@/hooks/useLiveLog';
import { fetchLiveListByYear } from '@/services/liveService';
import { fetchAchiveUser } from '@/services/userService';
import type { LiveDetail } from '@/types/live';
import { LiveList } from '@/components/features/LiveList';
import SetlistModal from '@/components/SetlistModal';

export default function LarcLiveArchivePage() {
  const { state, refs, handlers } = useLiveLog();
  
  const [mounted, setMounted] = useState(false);
  const [selectedLiveId, setSelectedLiveId] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<LiveDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [achiveUser, setAchiveUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    const loadData = async () => {
      try {
        // 1. まず対象ユーザーの情報を取得
        // 現在は固定値userIdを使用しているが、将来的にはログインユーザーのIDを取得するように変更する予定
        const userId = "00000000001";
        const userData = await fetchAchiveUser(userId);
        setAchiveUser(userData);

        // 2. 取得した userId に紐づく LiveEvents だけを取得するように引数を渡す
        let flatData: LiveDetail[] = [];
        if (userData && userData.userId) {
          const dataByYear = await fetchLiveListByYear(userData.userId);
          flatData = Object.values(dataByYear).flat();
        } else {
          // ユーザーデータが取れなかった場合のフォールバック
          const dataByYear = await fetchLiveListByYear();
          flatData = Object.values(dataByYear).flat();
        }

        const sorted = flatData.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setLiveData(sorted);
      } catch (error) {
        console.error("データの取得に失敗しました", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (!mounted) return null; 

  const selectedLiveDetail = selectedLiveId 
    ? liveData.find(detail => detail.id === selectedLiveId) || null 
    : null;

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#000428]">
          <div className="w-8 h-8 border-4 border-[#1abc9c] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#1abc9c] font-bold tracking-widest animate-pulse">LOADING...</p>
        </div>
      )}

      {/* ▼▼▼ 修正箇所：背景の透過度を設定し、すりガラス効果（ぼやけ）を解除 ▼▼▼ */}
      <div id="app" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', position: 'relative', zIndex: 10, display: isLoading ? 'none' : 'block', background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'none' }}>
      {/* ▲▲▲ 修正箇所 ここまで ▲▲▲ */}
        <div className="flex flex-col items-center w-full z-10 pt-4 pb-4 animate-in slide-in-from-right duration-500 text-white font-sans">
          
          {state.message && (
            <div className="fixed top-10 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl z-[200] font-bold text-sm">
              {state.message}
            </div>
          )}

          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Live Archives Demo</h1>
            <div className="inline-flex items-center border-2 border-[#1abc9c] bg-[#1abc9c]/10 px-4 py-1.5 rounded-full shadow-lg">
              <span className="bg-[#002a6e] text-white font-bold px-3 py-1 rounded-md mr-3 text-sm shadow-md tracking-wider">
                {liveData.length} Lives
              </span>
              <span className="text-[#1abc9c] font-bold text-sm tracking-widest uppercase">Archived</span>
            </div>
          </header>

          <div className="w-full flex flex-col bg-[#0d1117] p-6 rounded-[2rem] border border-white/10 shadow-2xl">
            
            <section className="mb-6">
              <p className="text-gray-400 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Profile:</p>
              <div className="flex items-end w-full gap-4">
              <div className="w-20 flex-shrink-0">
                  <div className="w-full aspect-square bg-[#161b22] border border-gray-700 rounded-xl flex items-center justify-center overflow-hidden transition-all">
                  {achiveUser?.iconUrl && (
                    <img src={achiveUser.iconUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="User Icon" />
                  )}
                  </div>
              </div>
                <div className="flex-grow">
                  <input 
                    type="text" 
                    value={achiveUser?.profileName || ""} 
                    readOnly
                    className="w-full bg-[#161b22] border border-gray-700 rounded-xl px-5 py-4 outline-none text-white text-lg font-bold shadow-inner opacity-50 cursor-not-allowed" 
                  />
                </div>
              </div>
            </section>

            <input type="file" ref={refs.fileInputRef} className="hidden" accept="image/*" onChange={handlers.handleIconChange} />

            <LiveList 
              lives={liveData} 
              checkedIds={state.checkedIds} 
              onToggle={handlers.toggleLive} 
              onClickRow={(id) => setSelectedLiveId(id)} 
            />

            <div className="flex items-center gap-4 min-h-[80px]">
              {state.checkedIds.length > 0 && (
                <div className="bg-white p-1 rounded-lg shadow-inner">
                  <canvas ref={refs.qrRef} style={{ width: '70px', height: '70px' }}></canvas>
                </div>
              )}
              <button 
                onClick={handlers.handleExport} 
                disabled={state.isProcessing || !state.libsReady} 
                className="flex-grow bg-white text-black py-5 rounded-full font-bold text-lg active:scale-95 transition-all shadow-xl hover:bg-gray-100"
              >
                {state.isProcessing ? 'Creating...' : 'Save Live Archive Image'}
              </button>
            </div>

            {/* ▼▼▼ ここにUI用のコピーライトを追加 ▼▼▼ */}
            <div className="mt-6 text-center">
              <span className="text-gray-500 text-xs font-bold tracking-widest opacity-60">
                    Copyright© 2026 y.k
              </span>
            </div>
            {/* ▲▲▲ 追加箇所ここまで ▲▲▲ */}

          </div>

          {state.modalImage && (
            <div className="fixed inset-0 bg-black/95 z-[500] flex flex-col items-center justify-center p-6" onClick={() => handlers.setModalImage(null)}>
              <div className="w-full max-w-sm animate-in zoom-in duration-300">
                <img src={state.modalImage} className="w-full rounded-2xl shadow-lg mb-6" alt="Exported Result" />
              </div>
              <p className="text-white text-sm mb-8 font-bold opacity-60 text-center">長押しまたは右クリックで保存してください</p>
              <button className="w-full max-w-[240px] bg-white text-black py-4 rounded-full font-bold shadow-2xl" onClick={() => handlers.setModalImage(null)}>閉じる</button>
            </div>
          )}

          {selectedLiveDetail && (
            <SetlistModal 
              live={selectedLiveDetail} 
              onClose={() => setSelectedLiveId(null)} 
            />
          )}

          {/* 画像生成用隠しノード */}
          <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
            <div ref={refs.exportRef} className="w-[420px] bg-[#000428] p-10 rounded-3xl">
              <div className="bg-[#0d1117] p-8 rounded-[2rem] text-white border border-white/10 shadow-2xl">
                
                <div className="flex items-center gap-5 border-b border-white/10 pb-8 mb-8">
                  {achiveUser?.iconUrl && (
                    <img src={achiveUser.iconUrl} crossOrigin="anonymous" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" alt="icon" />
                  )}
                  <div className="flex flex-col items-start gap-2">
                    <h2 className="text-2xl font-bold leading-tight">{achiveUser?.profileName || 'user'}'s Log</h2>
                    <div className="border-2 border-[#1abc9c] rounded-full px-4 py-1">
                      <span className="text-[#1abc9c] font-bold text-sm">Live {state.checkedIds.length} Archived</span>
                    </div>
                  </div>
                </div>
                
                <table className="w-full border-collapse">
                  <tbody>
                    {liveData.filter(l => state.checkedIds.includes(l.id)).map(l => (
                      <tr key={l.id}>
                        <td className="w-7 align-top pt-[12px] pb-6">
                          <div className="w-3 h-3 bg-[#1abc9c] rounded-full" />
                        </td>
                        <td className="align-top pb-6">
                          <div className="text-lg font-bold leading-none mb-1.5">{l.artist}</div>
                          <div className="text-lg font-bold leading-tight">{l.tourName}</div>
                          <div className="text-xs text-gray-400 mt-1">{l.date} @{l.venue}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* ▼▼▼ ここに画像書き出し用のコピーライトを追加 ▼▼▼ */}
                <div className="mt-4 pt-4 border-t border-white/10 text-right">
                  <span className="text-gray-500 text-[10px] font-bold tracking-widest opacity-80">
                    Copyright© 2026 y.k
                  </span>
                </div>
                {/* ▲▲▲ 追加箇所ここまで ▲▲▲ */}

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
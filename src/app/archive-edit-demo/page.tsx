"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import { useLiveLog } from '@/hooks/useLiveLog';
import { fetchLiveListByYear, saveLiveEvent, deleteLiveEvent } from '@/services/liveService';
import { fetchAchiveUser, updateAchiveUser } from '@/services/userService';
import { generateUploadUrl } from '@/services/s3Service';
import type { LiveDetail, SetlistItem } from '@/types/live';
import { LiveList } from '@/components/features/LiveList';
import getCroppedImg from '@/utils/cropImage';

const TARGET_USER_ID = "00000000001";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function LarcLiveArchiveEditPage() {
  const { state, refs, handlers } = useLiveLog();
  const [mounted, setMounted] = useState(false);
  const [liveData, setLiveData] = useState<LiveDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [achiveUser, setAchiveUser] = useState<any>(null);
  
  // プロフィール編集用State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIconUrl, setEditIconUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  // 画像クロップ用State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // ▼▼▼ 追加：ライブ情報編集用State ▼▼▼
  const [isLiveEditModalOpen, setIsLiveEditModalOpen] = useState(false);
  const [editLiveFormData, setEditLiveFormData] = useState<Partial<LiveDetail>>({});
  const [previewMode, setPreviewMode] = useState<'save' | 'delete' | null>(null); // プレビュー画面のモード
  const [isLiveSaving, setIsLiveSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await fetchAchiveUser(TARGET_USER_ID);
      setAchiveUser(userData);
      setEditName(userData?.profileName || "");
      setEditIconUrl(userData?.iconUrl ? `${userData.iconUrl}?t=${Date.now()}` : "");

      const dataByYear = await fetchLiveListByYear(userData?.userId || TARGET_USER_ID);
      const flatData = Object.values(dataByYear).flat();
      
      // ソート：未定（dateが空）を一番上、それ以外は降順
      const sorted = flatData.sort((a, b) => {
        if (!a.date) return -1;
        if (!b.date) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setLiveData(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (msg: string) => {
    setLocalMessage(msg);
    setTimeout(() => setLocalMessage(""), 3000);
  };

  // --- アイコン画像関連 ---
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showMessage("JPEG, PNG, WebP形式のみアップロード可能です"); return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showMessage("5MB以下の画像を選択してください"); return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result as string));
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  
  // ▼ 修正: _ に any 型を明示的に付与
  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => setCroppedAreaPixels(croppedAreaPixels), []);
  
  const handleCropSave = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      setEditIconUrl(URL.createObjectURL(croppedBlob));
      setImageSrc(null); 
    } catch (e) { showMessage("画像の切り抜きに失敗しました"); }
  };
  const handleSaveEdit = async () => {
    if (!editName.trim()) { showMessage("プロフィール名は必須です"); return; }
    setIsUpdating(true); 
    try {
      let finalIconUrl = achiveUser.iconUrl;
      if (editIconUrl.startsWith('blob:')) {
        const response = await fetch(editIconUrl);
        const blob = await response.blob();
        const { uploadUrl, objectUrl } = await generateUploadUrl("icon.jpg", 'image/jpeg', TARGET_USER_ID);
        await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": 'image/jpeg' } });
        finalIconUrl = objectUrl;
      }
      await updateAchiveUser(TARGET_USER_ID, editName, finalIconUrl);
      setAchiveUser({ ...achiveUser, profileName: editName, iconUrl: finalIconUrl });
      setIsEditMode(false);
    } catch (error) {
      showMessage("更新に失敗しました");
    } finally {
      setIsUpdating(false);
    }
  };

  // ========================================================
  // 新規追加・編集関連ロジック
  // ========================================================
  const openLiveEditModal = (id: string | null) => {
    if (id) {
      // 既存データの編集
      const target = liveData.find(l => l.id === id);
      if (target) {
        setEditLiveFormData(JSON.parse(JSON.stringify(target))); // ディープコピー
      }
    } else {
      // 新規作成
      setEditLiveFormData({
        artist: "",
        tourName: "",
        date: "",
        prefecture: "",
        venue: "",
        memo: "",
        setlist: [],
        userId: TARGET_USER_ID,
        isChecked: false
      });
    }
    setIsLiveEditModalOpen(true);
  };

  const handleLiveFormChange = (field: keyof LiveDetail, value: any) => {
    setEditLiveFormData(prev => ({ ...prev, [field]: value }));
  };

  // セットリスト操作
  const addSetlistItem = () => {
    const list = (editLiveFormData.setlist as SetlistItem[]) || [];
    const newItem: SetlistItem = { songOrder: list.length + 1, songTitle: "" };
    handleLiveFormChange('setlist', [...list, newItem]);
  };

  const removeSetlistItem = (index: number) => {
    const list = (editLiveFormData.setlist as SetlistItem[]) || [];
    const newList = list.filter((_, i) => i !== index).map((item, i) => ({ ...item, songOrder: i + 1 }));
    handleLiveFormChange('setlist', newList);
  };

  const moveSetlistItem = (index: number, direction: -1 | 1) => {
    const list = (editLiveFormData.setlist as SetlistItem[]) || [];
    if (index + direction < 0 || index + direction >= list.length) return;
    const newList = [...list];
    // 要素の入れ替え
    const temp = newList[index];
    newList[index] = newList[index + direction];
    newList[index + direction] = temp;
    // 順番（songOrder）の再採番
    const reorderedList = newList.map((item, i) => ({ ...item, songOrder: i + 1 }));
    handleLiveFormChange('setlist', reorderedList);
  };

  const updateSetlistItemTitle = (index: number, title: string) => {
    const list = (editLiveFormData.setlist as SetlistItem[]) || [];
    const newList = [...list];
    newList[index].songTitle = title;
    handleLiveFormChange('setlist', newList);
  };

  // 保存・削除のプレビューへ進むバリデーション
  const initiateSave = () => {
    if (!editLiveFormData.artist?.trim() || !editLiveFormData.tourName?.trim()) {
      showMessage("アーティスト名とツアー名は必須です"); return;
    }
    if (editLiveFormData.memo && editLiveFormData.memo.length > 200) {
      showMessage("メモは200文字以内で入力してください"); return;
    }
    setPreviewMode('save');
  };

  const initiateDelete = () => {
    setPreviewMode('delete');
  };

  // プレビューからの実際のDB処理実行
  const executeAction = async () => {
    setIsLiveSaving(true);
    try {
      if (previewMode === 'save') {
        const cleanedSetlist = ((editLiveFormData.setlist as SetlistItem[]) || []).filter(s => s.songTitle.trim() !== "");
        const dataToSave = { ...editLiveFormData, setlist: cleanedSetlist } as LiveDetail;
        await saveLiveEvent(dataToSave);
      } else if (previewMode === 'delete' && editLiveFormData.id) {
        await deleteLiveEvent(editLiveFormData.id);
        handlers.toggleLive(editLiveFormData.id); // もしチェックされていれば外す
      }
      // 再読み込みしてモーダルを閉じる
      await loadData();
      setIsLiveEditModalOpen(false);
      setPreviewMode(null);
    } catch (e) {
      showMessage(`処理に失敗しました: ${previewMode === 'save' ? '保存' : '削除'}`);
    } finally {
      setIsLiveSaving(false);
    }
  };


  if (!mounted) return null;

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#000428]">
          <div className="w-8 h-8 border-4 border-[#1abc9c] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#1abc9c] font-bold tracking-widest animate-pulse">LOADING...</p>
        </div>
      )}

      {isUpdating && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-[#0F0] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_#0F0]"></div>
          <p className="text-[#0F0] font-bold tracking-widest animate-pulse text-lg">UPDATING...</p>
        </div>
      )}

      {(state.message || localMessage) && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl z-[200] font-bold text-sm text-center w-[90%] max-w-sm">
          {state.message || localMessage}
        </div>
      )}

      {/* プロフィール画像クロッパー */}
      {imageSrc && (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col">
          <div className="relative flex-grow">
            <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} objectFit="contain" />
          </div>
          <div className="p-6 bg-[#161b22] border-t border-gray-700 pb-10">
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-6" />
            <div className="flex gap-4">
              <button onClick={() => setImageSrc(null)} className="flex-1 py-4 font-bold text-white bg-gray-700 rounded-xl">Cancel</button>
              <button onClick={handleCropSave} className="flex-1 py-4 font-bold text-black bg-[#1abc9c] rounded-xl shadow-[0_0_15px_rgba(26,188,156,0.5)]">OK (Crop)</button>
            </div>
          </div>
        </div>
      )}

      {/* メイン画面 */}
      <div id="app" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', position: 'relative', zIndex: 10, display: isLoading ? 'none' : 'block', background: 'rgba(0, 0, 0, 0.3)' }}>
        <div className="flex flex-col items-center w-full z-10 pt-4 pb-4 animate-in slide-in-from-right duration-500 text-white font-sans">
          
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Live Archives Edit</h1>
            <div className="inline-flex items-center border-2 border-[#1abc9c] bg-[#1abc9c]/10 px-4 py-1.5 rounded-full shadow-lg">
              <span className="bg-[#002a6e] text-white font-bold px-3 py-1 rounded-md mr-3 text-sm shadow-md tracking-wider">{liveData.length} Lives</span>
              <span className="text-[#1abc9c] font-bold text-sm tracking-widest uppercase">Archived</span>
            </div>
          </header>

          <div className="w-full flex flex-col bg-[#0d1117] p-6 rounded-[2rem] border border-white/10 shadow-2xl">
            {/* プロフィールセクション */}
            <section className="mb-6">
              <p className="text-[#1abc9c] text-xs font-bold mb-2 ml-1 uppercase tracking-wider">{isEditMode ? 'EDIT PROFILE:' : 'PROFILE:'}</p>
              <div className="flex items-end w-full gap-4">
                <div 
                  className={`w-20 flex-shrink-0 ${isEditMode ? 'cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-[#1abc9c] ring-offset-2 ring-offset-[#0d1117] rounded-xl' : ''}`}
                  onClick={() => isEditMode && editFileInputRef.current?.click()}
                >
                  <div className="w-full aspect-square bg-[#161b22] border border-gray-700 rounded-xl flex items-center justify-center overflow-hidden relative">
                    {editIconUrl ? (
                      <img src={editIconUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="User Icon" />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                    {isEditMode && (
                      <div className="absolute bottom-0 w-full bg-black/60 text-center py-1">
                        <span className="text-[10px] font-bold text-white tracking-widest">EDIT</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-grow">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} readOnly={!isEditMode} maxLength={20}
                    className={`w-full bg-[#161b22] border rounded-xl px-5 py-4 outline-none text-white text-lg font-bold shadow-inner transition-all ${isEditMode ? 'border-[#1abc9c] focus:bg-[#0d1117]' : 'border-gray-700 opacity-50 cursor-not-allowed'}`} />
                  {isEditMode && <p className="text-right text-[10px] text-gray-500 mt-1">{editName.length} / 20</p>}
                </div>
              </div>
              <input type="file" ref={editFileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={onFileChange} />
            </section>

            {/* 新規追加ボタンA */}
            <button onClick={() => openLiveEditModal(null)} className="w-full py-4 bg-[#161b22] text-white rounded-xl mb-4 font-bold border-2 border-dashed border-gray-600 hover:border-[#1abc9c] hover:bg-[#1abc9c]/10 transition-colors flex items-center justify-center gap-2">
              <span className="text-2xl leading-none">＋</span> <span>ライブ記録を追加</span>
            </button>

            {/* ライブ一覧（クリックで編集モーダルが開くよう onClickRow を設定） */}
            <LiveList lives={liveData} checkedIds={state.checkedIds} onToggle={handlers.toggleLive} onClickRow={(id) => openLiveEditModal(id)} />

            {/* 各種操作ボタン */}
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center gap-4 min-h-[80px]">
                {state.checkedIds.length > 0 && (
                  <div className="bg-white p-1 rounded-lg shadow-inner flex-shrink-0">
                    <canvas ref={refs.qrRef} style={{ width: '70px', height: '70px' }}></canvas>
                  </div>
                )}
                <button onClick={handlers.handleExport} disabled={state.isProcessing || !state.libsReady || isEditMode} 
                  className="flex-grow bg-white text-black py-5 rounded-full font-bold text-lg active:scale-95 transition-all shadow-xl hover:bg-gray-100 disabled:opacity-50">
                  {state.isProcessing ? 'Creating...' : 'Save Live Archive Image'}
                </button>
              </div>

              {isEditMode ? (
                <div className="flex gap-4">
                  <button onClick={() => { setIsEditMode(false); setEditName(achiveUser.profileName); setEditIconUrl(`${achiveUser.iconUrl}?t=${Date.now()}`); }} 
                    className="flex-1 bg-transparent border-2 border-gray-600 text-gray-400 py-3 rounded-full font-bold active:scale-95 transition-all">Cancel</button>
                  <button onClick={handleSaveEdit} className="flex-1 bg-[#1abc9c] text-black py-3 rounded-full font-bold active:scale-95 transition-all shadow-[0_0_15px_rgba(26,188,156,0.3)]">Save Profile</button>
                </div>
              ) : (
                <button onClick={() => setIsEditMode(true)} className="w-full bg-transparent border-2 border-[#1abc9c] text-[#1abc9c] py-3 rounded-full font-bold active:scale-95 transition-all hover:bg-[#1abc9c] hover:text-black mt-2">Edit Profile</button>
              )}
            </div>
            <div className="mt-6 text-center">
              <span className="text-gray-500 text-xs font-bold tracking-widest opacity-60">Copyright© 2026 y.k</span>
            </div>
          </div>

          {/* 出力画像プレビューモーダル */}
          {state.modalImage && (
            <div className="fixed inset-0 bg-black/95 z-[500] flex flex-col items-center justify-center p-6" onClick={() => handlers.setModalImage(null)}>
              <div className="w-full max-w-sm animate-in zoom-in duration-300">
                <img src={state.modalImage} className="w-full rounded-2xl shadow-lg mb-6" alt="Exported Result" />
              </div>
              <p className="text-white text-sm mb-8 font-bold opacity-60 text-center">長押しまたは右クリックで保存してください</p>
              <button className="w-full max-w-[240px] bg-white text-black py-4 rounded-full font-bold shadow-2xl" onClick={() => handlers.setModalImage(null)}>閉じる</button>
            </div>
          )}

          {/* 画像生成用隠しノード（変更なし） */}
          <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
            <div ref={refs.exportRef} className="w-[420px] bg-[#000428] p-10 rounded-3xl">
              <div className="bg-[#0d1117] p-8 rounded-[2rem] text-white border border-white/10 shadow-2xl">
                <div className="flex items-center gap-5 border-b border-white/10 pb-8 mb-8">
                  {editIconUrl && (
                    <img src={editIconUrl} crossOrigin="anonymous" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" alt="icon" />
                  )}
                  <div className="flex flex-col items-start gap-2">
                    <h2 className="text-2xl font-bold leading-tight">{editName || 'user'}'s Log</h2>
                    <div className="border-2 border-[#1abc9c] rounded-full px-4 py-1">
                      <span className="text-[#1abc9c] font-bold text-sm">Live {state.checkedIds.length} Archived</span>
                    </div>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    {liveData.filter(l => state.checkedIds.includes(l.id)).map(l => (
                      <tr key={l.id}>
                        <td className="w-7 align-top pt-[12px] pb-6"><div className="w-3 h-3 bg-[#1abc9c] rounded-full" /></td>
                        <td className="align-top pb-6">
                          <div className="text-lg font-bold leading-none mb-1.5">{l.artist}</div>
                          <div className="text-lg font-bold leading-tight">{l.tourName}</div>
                          <div className="text-xs text-gray-400 mt-1">{l.date || "XX/XX 予定"} @{l.venue}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 pt-4 border-t border-white/10 text-right">
                  <span className="text-gray-500 text-[10px] font-bold tracking-widest opacity-80">Copyright© 2026 y.k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ライブ記録 編集・追加モーダル */}
      {/* ======================================================== */}
      {isLiveEditModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          {previewMode ? (
            // ================= プレビュー画面 =================
            <div className="bg-[#161b22] border border-gray-600 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <h2 className={`text-2xl font-bold mb-4 text-center ${previewMode === 'delete' ? 'text-red-500' : 'text-[#1abc9c]'}`}>
                {previewMode === 'delete' ? '削除の最終確認' : '登録内容のプレビュー'}
              </h2>
              
              <div className="flex-grow overflow-y-auto custom-scrollbar bg-black/40 p-4 rounded-xl border border-gray-700">
                <div className="text-sm font-bold text-gray-400 mb-1">【{editLiveFormData.date || "XX/XX 予定"}】</div>
                <div className="text-xl font-bold text-white mb-1">{editLiveFormData.artist}</div>
                <div className="text-lg font-bold text-white mb-2">{editLiveFormData.tourName}</div>
                <div className="text-sm text-gray-300 mb-6">@{editLiveFormData.venue} ({editLiveFormData.prefecture})</div>

                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-sm text-[#1abc9c] font-bold mb-3">セットリスト</h3>
                  {((editLiveFormData.setlist as SetlistItem[]) || []).length > 0 ? (
                     <ul className="space-y-2">
                       {((editLiveFormData.setlist as SetlistItem[]) || []).map(s => (
                         <li key={s.songOrder} className="text-white text-sm flex gap-3">
                           <span className="text-gray-500 w-6 text-right">{s.songOrder}.</span> 
                           <span>{s.songTitle || "(未入力)"}</span>
                         </li>
                       ))}
                     </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">登録なし</p>
                  )}
                </div>

                {editLiveFormData.memo && (
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <h3 className="text-sm text-[#1abc9c] font-bold mb-2">メモ</h3>
                    <p className="text-white text-sm whitespace-pre-wrap">{editLiveFormData.memo}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button onClick={() => setPreviewMode(null)} disabled={isLiveSaving} className="flex-1 bg-transparent border border-gray-500 text-white py-3 rounded-xl font-bold active:scale-95 disabled:opacity-50">キャンセル</button>
                <button onClick={executeAction} disabled={isLiveSaving} className={`flex-1 text-white py-3 rounded-xl font-bold active:scale-95 shadow-lg disabled:opacity-50 ${previewMode === 'delete' ? 'bg-red-600 hover:bg-red-500' : 'bg-[#1abc9c] hover:bg-[#128f76] text-black'}`}>
                  {isLiveSaving ? '処理中...' : '実行'}
                </button>
              </div>
            </div>
          ) : (
            // ================= 編集・入力画面 =================
            <div className="bg-[#0d1117] border border-[#1abc9c]/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#161b22] rounded-t-2xl">
                <h2 className="font-bold text-lg text-white">{editLiveFormData.id ? 'ライブ編集' : 'ライブ追加'}</h2>
                <button onClick={() => setIsLiveEditModalOpen(false)} className="text-gray-400 hover:text-white p-2 text-2xl leading-none">&times;</button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                <div>
                  <label className="text-xs text-[#1abc9c] font-bold mb-1 block">アーティスト <span className="text-red-500">*</span></label>
                  <input type="text" value={editLiveFormData.artist} onChange={e => handleLiveFormChange('artist', e.target.value)} placeholder="例: B'z" className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:border-[#1abc9c] outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#1abc9c] font-bold mb-1 block">ツアー名 <span className="text-red-500">*</span></label>
                  <input type="text" value={editLiveFormData.tourName} onChange={e => handleLiveFormChange('tourName', e.target.value)} placeholder="例: B'z LIVE-GYM 2026 FYOP+" className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:border-[#1abc9c] outline-none" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-[#1abc9c] font-bold mb-1 block">開催日 (空欄は未定)</label>
                    <input type="text" value={editLiveFormData.date || ""} onChange={e => handleLiveFormChange('date', e.target.value)} placeholder="例: 2026/05/03" className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:border-[#1abc9c] outline-none" />
                  </div>
                  <div className="w-1/3">
                    <label className="text-xs text-[#1abc9c] font-bold mb-1 block">都道府県</label>
                    <input type="text" value={editLiveFormData.prefecture} onChange={e => handleLiveFormChange('prefecture', e.target.value)} placeholder="例: 沖縄県" className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:border-[#1abc9c] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#1abc9c] font-bold mb-1 block">開催場所</label>
                  <input type="text" value={editLiveFormData.venue} onChange={e => handleLiveFormChange('venue', e.target.value)} placeholder="例: 沖縄アリーナ" className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:border-[#1abc9c] outline-none" />
                </div>

                <div className="border-t border-gray-800 pt-4 mt-2">
                  <label className="text-xs text-[#1abc9c] font-bold mb-3 block">セットリスト</label>
                  <div className="space-y-2 mb-3">
                    {((editLiveFormData.setlist as SetlistItem[]) || []).map((song, index, arr) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs w-5">{song.songOrder}.</span>
                        <input type="text" value={song.songTitle} onChange={e => updateSetlistItemTitle(index, e.target.value)} placeholder="曲名" className="flex-grow bg-[#161b22] border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-[#1abc9c] outline-none" />
                        <div className="flex flex-col gap-1">
                           <button onClick={() => moveSetlistItem(index, -1)} disabled={index === 0} className="text-gray-400 hover:text-white disabled:opacity-30 text-xs bg-gray-800 px-2 rounded">▲</button>
                           <button onClick={() => moveSetlistItem(index, 1)} disabled={index === arr.length - 1} className="text-gray-400 hover:text-white disabled:opacity-30 text-xs bg-gray-800 px-2 rounded">▼</button>
                        </div>
                        <button onClick={() => removeSetlistItem(index)} className="text-red-500 hover:bg-red-500/20 px-2 py-1 rounded text-lg">&times;</button>
                      </div>
                    ))}
                  </div>
                  {/* プラスボタンB */}
                  <button onClick={addSetlistItem} className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-bold border border-gray-600 hover:border-[#1abc9c] transition-colors">
                    ＋ 曲を追加
                  </button>
                </div>

                <div className="border-t border-gray-800 pt-4 mt-2 pb-6">
                  <label className="text-xs text-[#1abc9c] font-bold mb-1 flex justify-between">
                    <span>メモ</span>
                    <span className="text-gray-500">{(editLiveFormData.memo || "").length} / 200</span>
                  </label>
                  <textarea value={editLiveFormData.memo || ""} onChange={e => handleLiveFormChange('memo', e.target.value)} rows={3} maxLength={200} placeholder="思い出を自由に記録 (200文字まで)" className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:border-[#1abc9c] outline-none resize-none custom-scrollbar" />
                </div>
              </div>

              <div className="p-4 border-t border-gray-800 bg-[#161b22] rounded-b-2xl flex flex-wrap gap-3 justify-end">
                <button onClick={() => setIsLiveEditModalOpen(false)} className="px-5 py-2 text-white border border-gray-500 rounded-lg text-sm font-bold active:scale-95">戻る</button>
                {editLiveFormData.id && (
                  <button onClick={initiateDelete} className="px-5 py-2 text-white bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold active:scale-95 mr-auto">削除</button>
                )}
                <button onClick={initiateSave} className="px-8 py-2 text-black bg-[#1abc9c] hover:bg-[#128f76] rounded-lg text-sm font-bold active:scale-95 shadow-lg">決定</button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </>
  );
}
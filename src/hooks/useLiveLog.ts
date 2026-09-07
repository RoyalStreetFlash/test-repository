/**
 * src/hooks/useLiveLog.ts
 * ライブ参戦記録機能のビジネスロジックおよびステートフルな処理を集約したカスタムフックです。
 */

import { useState, useEffect, useRef } from 'react';
// 🔴 ローカルにインストールした強力なライブラリを普通にインポートする
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

export const useLiveLog = () => {
  /* 状態変数のカプセル化定義 */
  const [userName, setUserName] = useState<string>('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [userIcon, setUserIcon] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  /* DOM操作用リファレンスの定義 */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrRef = useRef<HTMLCanvasElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  /**
   * コンポーネント初期化時の副作用処理
   * URLパラメータからの状態復元（深層リンク対応）
   */
  useEffect(() => {
    // 💡 古いCDNのロード処理（loadScriptなど）はすべて削除しました
    const params = new URLSearchParams(window.location.search);
    setUserName(params.get('n') || '');
    const d = params.get('d')?.split(',') || [];
    setCheckedIds(d.filter(id => id !== ''));
  }, []);

  /**
   * 状態監視とアドレスバーの動的更新、およびQRコード生成
   */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (userName) url.searchParams.set('n', userName); else url.searchParams.delete('n');
    if (checkedIds.length > 0) url.searchParams.set('d', checkedIds.join(',')); else url.searchParams.delete('d');
    window.history.replaceState({}, '', url.toString());

    /* QRコードのリアルタイム生成 */
    // 💡 window.QRCode ではなく、インポートした QRCode を直接使う
    if (checkedIds.length > 0 && qrRef.current) {
      QRCode.toCanvas(qrRef.current, url.toString(), { width: 80, margin: 1 })
        .catch(err => console.error('QRコード生成エラー:', err));
    }
  }, [userName, checkedIds]);

  /**
   * 公演チェック状態のトグル処理ハンドラ
   */
  const toggleLive = (id: string) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  /**
   * ユーザーアイコンファイル選択時のイベントハンドラ
   */
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

  /**
   * HTML要素をCanvasとしてキャプチャし画像出力する非同期メソッド
   */
  const handleExport = async () => {
    if (isProcessing) return;
    if (checkedIds.length === 0) {
      setMessage("公演を選択してください");
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsProcessing(true);
    try {
      // 💡 window.html2canvas ではなく、インポートした html2canvas を直接使う
      if (exportRef.current) {
        const canvas = await html2canvas(exportRef.current, { 
          scale: 2, backgroundColor: null, useCORS: true 
        });
        setModalImage(canvas.toDataURL('image/png'));
      }
    } catch (e) {
      setMessage("画像の生成に失敗しました");
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    state: { userName, checkedIds, userIcon, isProcessing, modalImage, message, libsReady: true }, // libsReadyは常にtrue扱いに
    refs: { fileInputRef, qrRef, exportRef },
    handlers: { setUserName, toggleLive, handleIconChange, handleExport, setModalImage }
  };
};
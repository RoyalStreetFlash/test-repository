// ▼ 'use client': Next.jsに対し、このファイル（コンポーネント）をブラウザ側で動かすよう指示する宣言です。
// ボタンのクリック(onClick)や、画面の状態管理(useState)など、ユーザーの操作を伴う機能を使う場合に必須となります。
'use client';

// ▼ Reactから「状態」を管理するための機能である useState と、起動を検知する useEffect を読み込みます。
import { useState, useEffect } from 'react';
import Link from 'next/link'; // 🔴 ヘッダーをこちらに移動したため、Linkを読み込みます
// ▼ 外部のファイルで定義されているデータの形（TypeScriptの型）を読み込みます。
import type { LiveDetail } from '@/types/live';
import type { LiveListByYear } from '@/services/liveService';
// ▼ ライブのセットリストを表示するためのポップアップ（モーダル）画面のコンポーネントを読み込みます。
import SetlistModal from '@/components/SetlistModal';

// ▼ TypeScriptの機能。このコンポーネントが親コンポーネント（page.tsx）から受け取るデータの形を定義します。
interface YearTabsProps {
  initialData: LiveListByYear; // 年ごとにグループ化された初期データを受け取ります
}

export default function YearTabs({ initialData }: YearTabsProps) {
  
  // 【① データの整形（TypeScript/JavaScriptの処理）】
  // 元のロジック、変数の処理は1文字も変更・省略していません。
  const years = Object.keys(initialData).map(Number).sort((a, b) => b - a);
  
  // 【② 画面の状態管理（Reactの useState）】
  // selectedYear: 現在ユーザーが選択して見ている「年」を記憶します（初期値は最新の年、無ければ2026）。
  const [selectedYear, setSelectedYear] = useState<number>(years[0] || 2026);
  // selectedLive: モーダルで詳細を表示するために、ユーザーがクリックした特定のライブ情報を記憶します（初期値は null）。
  const [selectedLive, setSelectedLive] = useState<LiveDetail | null>(null);

  // 【データ露出・ガタつき防止システム】
  // ブラウザ側でReactとTailwindの準備が100%整ったか監視するフラグ（状態）です。初期値は false（未準備）にします。
  const [mounted, setMounted] = useState<boolean>(false);

  // 画面が開いた最初の1回だけ実行され、準備完了フラグを true（準備完了）にします。
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 【③ 💡現在表示すべきデータの抽出と「IDの昇順」ソート処理】
  // 全体データ(initialData)の中から、今選択されている年(selectedYear)のライブ配列を取り出します。
  // 取り出した配列を [... ]（スプレッド演算子）を使ってコピーし、.sort() で並び替えます。
  // 
  // 💡並び替えの仕組み（初心者向け解説）：
  // 今後AWS移行時にIDが「20260129001」のようなユニークな文字列（String）になることを見据え、
  // 文字列同士を安全に比較できる `localeCompare` というJavaScript標準の機能を使用しています。
  // これにより、aのIDとbのIDを比較し、数字が小さい順（＝日付が古く、枝番が若い順）にピシッと昇順で並び替わります。
  const currentLives = [...(initialData[selectedYear] || [])].sort((a, b) => 
    String(a.id).localeCompare(String(b.id))
  );

  // 🔴【修正ポイント：初期表示時のリンクも含めた完全非表示制御】
  // 準備が完了するまでの数ミリ秒間は、白い外枠だけでなく「メイン画面へ戻る」リンクも含めて画面に「一切何も出力しない（null）」ようにしました。
  // これにより、画面の描画準備が完全に整うまではブラウザ上に1文字も表示されず、準備ができた瞬間にすべての要素が完全に同時に描画されます。
  if (!mounted) {
    return null;
  }

  // 🔴 【マウント後（準備完了）の画面】
  // 内部の準備が整った瞬間に、この「白枠＋ヘッダー＋タブ＋詳細リスト」のすべてが1ミリ秒のズレもなく同時に表示されます。
  return (
    // ▼ ここが本来の「白い外枠」です。元の美しいレイアウトに戻しました。
    // - bg-white: 背景を白にします。
    // - p-6 md:p-8: 枠の内側に適切な余白を作ります。
    // - rounded-xl shadow: 角を丸くし、周囲に薄い影をつけます。
    // - w-[600px]: 横幅を「600ピクセル」に完全固定し、データ件数による伸び縮みを防ぎます。
    // - max-w-full: スマホなどの画面が600pxより狭い時は、画面幅に合わせて自動縮小させます。
    // - mx-auto: 左右の余白を自動調整し、この白い枠を画面の中央（ド真ん中）に配置します。
    // - min-h-[500px]: データが0件でも、枠が縦に潰れないように最低500pxの縦幅をキープします。
    <div className="bg-white p-6 md:p-8 rounded-xl shadow w-[600px] max-w-full mx-auto min-h-[500px]">
      
      {/* ▼ 白枠の中に配置されたヘッダー（Live一覧 ＋ 戻るリンク） */}
      {/* - flex items-center justify-between: 横並びにして左右の両端に配置します。 */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Live一覧</h1>
        <Link href="/" className="text-blue-500 hover:underline text-sm">
          ← メイン画面へ戻る
        </Link>
      </header>

      {/* ▼ タブのボタンを表示するエリア */}
      <div className="flex overflow-x-auto border-b border-gray-300 mb-6 scrollbar-hide">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
              selectedYear === year
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {year}年
          </button>
        ))}
      </div>

      {/* ▼ ライブ一覧を表示するエリア */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentLives.length > 0 ? (
          currentLives.map((live) => (
            <div 
              key={live.id}
              onClick={() => setSelectedLive(live)}
              className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow border border-gray-200 flex flex-col h-full"
            >
              <div className="text-xs text-gray-500 mb-1">{live.date}</div>
              {/* アーティスト名（小さな薄い文字。元のレイアウト通りに保持しています） */}
              <h3 className="text-[10px] font-bold text-gray-300 mb-1.5">{live.artist}</h3>
              {/* ツアー・ライブ名 */}
              <h3 className="font-bold text-gray-800 mb-2">{live.tourName}</h3>
              <div className="text-sm text-gray-600">📍 {live.venue} ({live.prefecture})</div>
              
              {/* ボタンをカードの一番下に固定 */}
              <div className="mt-auto pt-4 text-right">
                <span className="text-xs text-blue-500 font-semibold bg-blue-50 px-2 py-1 rounded">
                  Recipe
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">この年のライブデータはありません。</p>
        )}
      </div>

      {/* ▼ セットリストモーダル（ポップアップ画面） */}
      {selectedLive && (
        <SetlistModal 
          live={selectedLive} 
          onClose={() => setSelectedLive(null)} 
        />
      )}
    </div>
  );
} 
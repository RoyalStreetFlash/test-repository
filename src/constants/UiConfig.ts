/**
 * src/constants/UiConfig.ts
 * アプリケーション全体のUIデザイン定義（スタイルクラス）を管理する定数ファイルです。
 * * 【役割】
 * JSX内に散らばるTailwind CSSのクラス定義を外部化し、
 * コンポーネント側をロジックと構造に専念させます。
 * * JavaのResourceBundleやプロパティファイルに近い役割を果たします。
 */

export const UI_CONFIG = {
  // メインコンテナのレイアウト
  SCREEN_CONTAINER: "flex flex-col items-center justify-center h-full mt-20 z-10 animate-in fade-in duration-500",
  
  // タイトルセクション
  TITLE_TEXT: "text-5xl font-black mb-2 text-center tracking-tighter text-white",
  SUB_TITLE_TEXT: "text-gray-400 text-center mb-12 text-sm tracking-widest uppercase",
  
  // メニューカード（アクティブ）
  MENU_CARD: "block w-full bg-[#0d1117] border border-gray-700 hover:border-[#1abc9c] p-6 rounded-2xl shadow-xl transition-all cursor-pointer group",
  MENU_CARD_TITLE: "text-xl font-bold text-white group-hover:text-[#1abc9c] transition-colors",
  MENU_CARD_DESC: "text-xs text-gray-500 mt-2",
  
  // メニューカード（無効/開発中）
  DISABLED_CARD: "block w-full bg-[#0d1117]/50 border border-gray-800 p-6 rounded-2xl shadow-inner opacity-50 cursor-not-allowed",
  DISABLED_CARD_TITLE: "text-xl font-bold text-gray-500",
  DISABLED_CARD_DESC: "text-xs text-gray-600 mt-2",
  
  // 全体共通のスペース設定
  CARD_SPACING: "space-y-4 w-full px-4"
};
/**
 * src/types/live.ts
 * * アプリケーション全体のデータ構造、インターフェース、および型定義を集中管理するファイルです。
 * （Entity / DTO / State 層の定義）
 * * 【変更点】
 * - 旧 LiveEvent.tsx および types.tsx をこのファイルに一本化しました。
 * - 重複していた LIVE_DATA（マスターデータ）や、不要になった window 拡張定義は削除済みです。
 */

/**
 * 日付フォーマットの厳格な型定義 (Template Literal Types)
 * "YYYY/MM/DD" の形式をTypeScript上で表現します。
 */
export type DateString = `${number}/${number}/${number}`;

/**
 * ライブ公演情報のデータ構造定義 (Entity)
 * 静的データ（data.ts）やデータベースから取得するライブ情報の基本形です。
 */
export interface LiveEvent {
  /** 公演を一意に識別するためのユニークID (例: '20th-mizu-01') */
  id: string;
  
  /** ツアー名またはライブタイトル (例: '20th LIVE CIRCUIT “水”') */
  artist: string;

  /** ツアー名またはライブタイトル (例: '20th LIVE CIRCUIT “水”') */
  tourName: string;
  
  /** 公演日 ("YYYY/MM/DD" 形式の文字列、または動的文字列) */
  date: DateString | string;
  
  /** 公演が開催される会場名 (例: '市原市市民会館 大ホール') */
  venue: string;
  
  /** 開催地の都道府県 (例: '千葉県') */
  prefecture: string;
  
  /** ユーザーがその公演を選択（参戦記録にチェック）しているかどうかのフラグ */
  isChecked: boolean;
}

/**
 * アプリケーションの画面・ロジック全体の状態管理定義 (State)
 * カスタムフック `useLiveLog` が管理する状態、および画面に渡すデータの構造を縛ります。
 */
export interface AppState {
  /** ユーザーが入力した名前 */
  userName: string;
  
  /** ユーザーがチェックを入れた公演のID（文字列）の配列 */
  checkedIds: string[];
  
  /** ユーザーがアップロードしたアイコン画像のデータ（Base64形式の文字列、または未設定時はnull） */
  userIcon: string | null;
  
  /** 画像エクスポート処理などが実行中（ローディング状態）であるかを示すフラグ */
  isProcessing: boolean;
  
  /** 生成された画像のデータ（Base64形式の文字列、またはモーダル非表示時はnull） */
  modalImage: string | null;
  
  /** 画面上に表示する通知・警告メッセージ（例: '公演を選択してください'） */
  message: string;
  
  /** * ライブラリ（html2canvas / qrcode）が利用可能かを示すフラグ
   * ※Next.jsへの移行に伴いローカルインポート化したため、ロジック側では常にtrueとして扱われます。
   */
  libsReady: boolean;
}

/**
 * セットリストの1曲ごとのデータ構造
 */
export interface SetlistItem {
  songOrder: number; // 曲順
  songTitle: string; // 曲名
}

/**
 * ライブ詳細（セットリスト含む）のデータ構造
 * 既存のLiveEventを拡張し、タブ表示用の「年」や「セットリスト」を持たせます。
 * 今後AWSのDB（DynamoDB等）で管理されるデータのベースとなります。
 */
export interface LiveDetail extends LiveEvent {
  year: number; // タブ分け用の年 (例: 2024, 2025, 2026)
  setlist: SetlistItem[] | string; // ▼修正：文字列での登録も許容する
  memo?: string; // ▼修正：DynamoDBから取得する任意項目のメモを追加
  userId?: string; // ▼修正：紐づけるユーザーIDを追加
}
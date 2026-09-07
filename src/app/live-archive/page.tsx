// src/app/live-archive/page.tsx
import { fetchLiveListByYear } from '@/services/liveService';
import YearTabs from '@/components/live-archive/YearTabs';

// AWSのコストを抑えつつ、最大60秒の遅延で管理画面の更新を本番に即時反映させる設定
// next.jsの機能であり、変数名自体に意味がある。現在はリデプロイで補うため、不要とする
// export const revalidate = 60;

export default async function LiveArchivePage() {
  // サーバー側でAWS（DynamoDB）から年別にグループ化されたライブデータを取得
  const liveListByYear = await fetchLiveListByYear();     

  return (    
    // Excelの画面レイアウト構成、および既存のスマートフォン・PC両対応（maxWidth: 500px / 600px）設計に準拠
    <main className="min-h-screen p-4 md:p-8">
      
      {/* 
        年別タブ表示、およびクリック時のセットリストモーダル制御を行う
        Client Component（YearTabs）へ、AWSから取得したデータをProps（initialData）として安全に引き渡します。
      */}
      <YearTabs initialData={liveListByYear} />
      
    </main>
  );
} 
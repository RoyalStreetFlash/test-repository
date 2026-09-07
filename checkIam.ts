import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { config } from "dotenv";

// .env.localから環境変数を読み込む
config({ path: ".env.local" });

async function checkIam() {
  console.log("🔍 IAMアクセスキーの有効性チェックを開始します...");
  
  // 文字列の前後に見えないスペースが混入していないか確認するための出力
  const accessKey = process.env.AWS_ACCESS_KEY_ID || "";
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY || "";
  
  console.log(`[デバッグ] アクセスキーの長さ: ${accessKey.length}文字 (末尾文字: '${accessKey.slice(-1)}')`);
  console.log(`[デバッグ] シークレットの長さ: ${secretKey.length}文字 (末尾文字: '${secretKey.slice(-1)}')\n`);

  const client = new STSClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  try {
    const command = new GetCallerIdentityCommand({});
    const response = await client.send(command);
    
    console.log("✅ 成功！IAMアクセスキーは正しく生きています。");
    console.log(`👤 接続先アカウント: ${response.Account}`);
    console.log(`🆔 ユーザーARN: ${response.Arn}`);
  } catch (error: any) {
    console.error("❌ エラー：IAMアクセスキーが無効、または署名に失敗しました。");
    console.error("エラー詳細:", error.message);
  }
}

checkIam();
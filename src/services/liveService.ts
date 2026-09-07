"use server";
import { LIVE_DETAIL_DATA } from '@/constants/LiveData';
import type { LiveDetail } from '@/types/live';
import { DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";

export type LiveListByYear = Record<string | number, LiveDetail[]>; // TBDタブ用に string も許容

// 共通のDynamoDBクライアント初期化
const getClient = () => new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const getTableName = () => process.env.DYNAMODB_LIVEEVENT_TABLE_NAME || "LiveEvents";

// ==========================================
// ライブ一覧の取得
// ==========================================
export async function fetchLiveListByYear(userId?: string): Promise<LiveListByYear> {
  try {
    const client = getClient();
    const commandParams: any = { TableName: getTableName() };

    if (userId) {
      commandParams.FilterExpression = "userId = :userId";
      commandParams.ExpressionAttributeValues = { ":userId": { S: userId } };
    }

    const command = new ScanCommand(commandParams);
    const response = await client.send(command);

    if (response.Items) {
      const data = response.Items.map(item => unmarshall(item) as LiveDetail);
      return groupAndSortLives(data);
    }
    return {};
  } catch (error) {
    console.error("DynamoDBからのデータ取得に失敗しました:", error);
    console.log("⚠️ ローカルのダミーデータを使用します");
    let data: any[] = LIVE_DETAIL_DATA;
    if (userId) {
      data = data.filter((live) => live.userId === userId || !live.userId);
    }
    return groupAndSortLives(data);
  }
}

// データの年別グループ化とソート処理の共通化
function groupAndSortLives(data: LiveDetail[]): LiveListByYear {
  const groupedList = data.reduce((acc, live) => {
    // 日付未定(nullまたは空)の場合は 'TBD' タブに振り分ける
    const groupKey = live.date ? (live.year || new Date(live.date).getFullYear()) : 'TBD';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(live);
    return acc;
  }, {} as LiveListByYear);

  // 各グループ内でソート（未定を上に、それ以外は日付の降順）
  Object.keys(groupedList).forEach(key => {
    groupedList[key].sort((a, b) => {
      if (!a.date) return -1; // aが未定なら上に
      if (!b.date) return 1;  // bが未定なら上に
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  });

  return groupedList;
}

// ==========================================
// ライブデータの登録・更新（ランダム10桁ID）
// ==========================================
export async function saveLiveEvent(live: LiveDetail): Promise<LiveDetail> {
  const client = getClient();
  let id = live.id;
  let success = false;
  let attempt = 0;
  let itemToSave = { ...live };

  // 年の自動補完
  if (itemToSave.date) {
    itemToSave.year = new Date(itemToSave.date).getFullYear();
  } else {
    itemToSave.year = 9999; // TBD用ダミー
  }

  while (!success && attempt < 5) {
    try {
      // IDが無い（新規）場合、10桁のランダムな数値を生成
      if (!id) {
        id = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      }
      itemToSave.id = id;

      const params: any = {
        TableName: getTableName(),
        Item: marshall(itemToSave, { removeUndefinedValues: true, convertEmptyValues: true }),
      };

      // 新規登録時のみ、ID重複チェックを行う（重複時はエラーが飛ぶ）
      if (!live.id) {
        params.ConditionExpression = "attribute_not_exists(id)";
      }

      await client.send(new PutItemCommand(params));
      success = true;
    } catch (e: any) {
      if (e.name === "ConditionalCheckFailedException" && !live.id) {
        console.warn(`ID ${id} は既に存在します。再生成します。`);
        id = ""; // IDを空にしてリトライ
        attempt++;
      } else {
        console.error("DynamoDB保存エラー:", e);
        throw e;
      }
    }
  }

  if (!success) {
    throw new Error("一意のID生成に失敗し、登録できませんでした。");
  }

  return itemToSave;
}

// ==========================================
// ライブデータの削除
// ==========================================
export async function deleteLiveEvent(id: string): Promise<void> {
  const client = getClient();
  try {
    await client.send(new DeleteItemCommand({
      TableName: getTableName(),
      Key: { id: { S: id } }
    }));
  } catch (error) {
    console.error("DynamoDB削除エラー:", error);
    throw error;
  }
}
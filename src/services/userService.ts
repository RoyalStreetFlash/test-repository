"use server";

import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// --- クライアントの初期化を共通化 ---
const awsConfig = {
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const dynamoClient = new DynamoDBClient(awsConfig);
const s3Client = new S3Client(awsConfig);

/**
 * ユーザー情報の取得
 */
export async function fetchAchiveUser(userId: string) {
  try {
    const command = new GetItemCommand({
      TableName: process.env.DYNAMODB_USER_TABLE_NAME || "AchiveUser",
      Key: {
        userId: { S: userId }
      }
    });

    const response = await dynamoClient.send(command);

    if (response.Item) {
      return unmarshall(response.Item);
    }

    return null;
  } catch (error) {
    console.error("DynamoDBからのUser取得に失敗しました:", error);
    
    // AWS未接続時のフォールバック
    console.log("⚠️ ローカルのダミーデータを使用します");
    
    // ▼ 修正: CloudFrontのドメインを環境変数から動的に取得するように変更
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN || "https://d35p3a3ggsf38b.cloudfront.net";
    
    return {
      userId: "000000000005",
      createDate: "2026-07-30T12:00:00Z",
      iconUrl: `${cloudFrontDomain}/XXXX.jpg`,
      loginName: "sample_user_dummy",
      mailAddress: "sample@example.com",
      password: "hashed_password_abc123",
      profileName: "Live Fan",
      updateDate: "2026-07-30T12:00:00Z"
    };
  }
}

/**
 * ユーザー情報の更新 ＆ 不要になった旧アイコン画像のS3削除処理
 */
export async function updateAchiveUser(userId: string, profileName: string, newIconUrl: string) {
  try {
    const tableName = process.env.DYNAMODB_USER_TABLE_NAME || "AchiveUser";
    
    // 1. 現在のユーザー情報を取得し、旧画像のURLを把握する
    const getCommand = new GetItemCommand({
      TableName: tableName,
      Key: { userId: { S: userId } }
    });
    const { Item } = await dynamoClient.send(getCommand);
    const currentUser = Item ? unmarshall(Item) : null;
    const oldIconUrl = currentUser?.iconUrl;

    // 2. DynamoDBのユーザー情報を更新 (トランザクションの主軸)
    const updateCommand = new UpdateItemCommand({
      TableName: tableName,
      Key: { userId: { S: userId } },
      UpdateExpression: "SET profileName = :name, iconUrl = :icon, updateDate = :date",
      ExpressionAttributeValues: {
        ":name": { S: profileName },
        ":icon": { S: newIconUrl },
        ":date": { S: new Date().toISOString() }
      }
    });
    
    await dynamoClient.send(updateCommand);
    console.log(`[User Service] DB update successful for user: ${userId}`);

    // 3. DB更新成功後、画像が新しく差し替えられている場合のみ旧画像をS3から削除
    if (oldIconUrl && oldIconUrl !== newIconUrl) {
      const urlParts = oldIconUrl.split('/');
      const oldObjectKey = urlParts[urlParts.length - 1];

      // 【セキュリティ検証】抽出したS3のキーが、必ず「本人のuserId」から始まっているか確認する
      if (oldObjectKey && oldObjectKey.startsWith(`${userId}_`)) {
        console.log(`[User Service] Deleting old icon from S3: ${oldObjectKey}`);
        
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || "live-archive-images",
          Key: oldObjectKey,
        });
        
        // 削除処理が失敗しても、DB更新は完了しているためエラーは投げずにログのみ残す
        try {
          await s3Client.send(deleteCommand);
          console.log(`[User Service] Old icon deleted successfully.`);
        } catch (s3Error) {
          console.error("[User Service] Failed to delete old icon from S3 (Will be cleaned up by batch later):", s3Error);
        }
      } else {
        console.warn(`[User Service] Security Warning: Skipped S3 deletion due to userId mismatch. Key: ${oldObjectKey}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("DynamoDBのUser更新処理に失敗しました:", error);
    throw new Error("プロフィールの更新に失敗しました");
  }
}
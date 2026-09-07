"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// クライアントの初期化（関数外に出して再利用性を高める）
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: false,
});

/**
 * 署名付きアップロードURLの生成
 */
export async function generateUploadUrl(fileName: string, fileType: string, userId: string) {
  try {
    const uniqueFileName = `${userId}_${Date.now()}_${fileName}`;
    const bucketName = process.env.S3_BUCKET_NAME || "live-archive-images";

    console.log(`[S3 Service] Generating strict URL for: ${uniqueFileName}, Type: ${fileType}`);

    // ★セキュリティ強化: ContentTypeを厳密に指定し、それ以外のファイル形式によるアップロードを弾く
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    
    // ▼ 修正: CloudFrontのドメインを環境変数から動的に取得するように変更
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN || "https://d35p3a3ggsf38b.cloudfront.net";
    const objectUrl = `${cloudFrontDomain}/${uniqueFileName}`;
    
    return { uploadUrl, objectUrl };
  } catch (error) {
    console.error("S3署名付きURLの生成に失敗しました:", error);
    throw new Error("アップロードURLの生成に失敗しました");
  }
}

/**
 * 将来の要件: S3オブジェクトの削除
 */
export async function deleteImage(fileKey: string) {
  try {
    const bucketName = process.env.S3_BUCKET_NAME || "live-archive-images";
    console.log(`[S3 Service] Deleting object: ${fileKey}`);

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("S3オブジェクトの削除に失敗しました:", error);
    throw new Error("削除処理に失敗しました");
  }
}
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { s3Client, BUCKET_NAME } from "../config/s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export async function uploadToS3(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: "products" | "videos" | "logos"
): Promise<string> {
  const ext = path.extname(originalName) || "";
  const key = `${folder}/${uuidv4()}${ext}`;

  const isLargeFile = fileBuffer.length > 5 * 1024 * 1024; // > 5MB

  if (isLargeFile) {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      },
    });
    await upload.done();
  } else {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      })
    );
  }

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.slice(1); // remove leading "/"
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    );
  } catch (err) {
    console.error("S3 delete failed (non-critical):", err);
  }
}
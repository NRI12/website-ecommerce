import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "ap-southeast-1" });

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function createUploadUrl(params: { contentType: string; folder: string }) {
  if (!ALLOWED_CONTENT_TYPES.has(params.contentType)) {
    throw new Error("Định dạng ảnh không được hỗ trợ.");
  }
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("S3_BUCKET_NAME chưa được cấu hình.");

  const extension = params.contentType.split("/")[1];
  const key = `uploads/${params.folder}/${nanoid()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = process.env.CLOUDFRONT_DOMAIN
    ? `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`
    : `https://${bucket}.s3.${process.env.AWS_REGION ?? "ap-southeast-1"}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl };
}

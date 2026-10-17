import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

function client(endpoint: string) {
  return new S3Client({
    region: env.s3.region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: env.s3.accessKey, secretAccessKey: env.s3.secretKey },
  });
}

// Server-side client for operations the app performs itself (DeleteObject).
let internal: S3Client | undefined;
// Public-endpoint client used only to sign URLs the browser will hit; the host
// in the signature must match what the browser can reach.
let pub: S3Client | undefined;

function s3Internal() {
  return (internal ??= client(env.s3.endpoint));
}
function s3Public() {
  return (pub ??= client(env.s3.publicEndpoint));
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export const EXT_BY_TYPE: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function presignPut(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: env.s3.bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3Public(), cmd, { expiresIn: env.s3.presignPutTtl });
}

export function presignGet(key: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: env.s3.bucket, Key: key });
  return getSignedUrl(s3Public(), cmd, { expiresIn: env.s3.presignGetTtl });
}

export async function deleteObject(key: string): Promise<void> {
  await s3Internal().send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key }));
}

/** Best-effort delete for replaced/removed images; a failure must not fail the request. */
export async function deleteObjectQuietly(key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await deleteObject(key);
  } catch (err) {
    console.warn("Failed to delete object", key, err);
  }
}

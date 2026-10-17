"use server";

import { getSessionUser } from "@/lib/auth/dal";
import { env } from "@/lib/env";
import { EXT_BY_TYPE, presignPut } from "@/lib/storage";
import { uploadRequestSchema } from "@/lib/validation";

export interface UploadTicket {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Step 1 of the upload flow: hand the browser a short-lived presigned PUT URL.
 * The file bytes never touch this server; the browser uploads straight to
 * object storage and then submits the returned key with the form.
 */
export async function requestUploadUrl(input: { filename: string; contentType: string }): Promise<UploadTicket> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) throw new Error("Unsupported file type. Use JPEG, PNG or WebP.");

  const key = `covers/${user.id}/${crypto.randomUUID()}.${EXT_BY_TYPE[parsed.data.contentType]}`;
  const uploadUrl = await presignPut(key, parsed.data.contentType);
  return { uploadUrl, key, expiresIn: env.s3.presignPutTtl };
}

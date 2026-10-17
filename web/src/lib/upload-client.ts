"use client";

import { requestUploadUrl } from "@/lib/actions/uploads";

/**
 * Browser side of the upload flow: ask the server for a presigned PUT URL,
 * then send the bytes straight to object storage, reporting progress.
 * Resolves with the storage key to submit alongside the form.
 */
export async function uploadImage(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const ticket = await requestUploadUrl({ filename: file.name, contentType: file.type });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", ticket.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) onProgress(Math.round((evt.loaded / evt.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });

  return ticket.key;
}

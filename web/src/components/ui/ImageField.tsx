"use client";

import { useState } from "react";
import { buttonClass } from "./styles";

interface ImageFieldProps {
  label: string;
  /** Form field name of the file input (read by the form's submit handler). */
  name: string;
  /** Hidden field set to "1" when the current image should be removed. */
  clearName: string;
  currentUrl: string | null;
  previewClassName: string;
  progress: number | null;
}

/** File picker with current-image preview, remove toggle and upload progress bar. */
export function ImageField({ label, name, clearName, currentUrl, previewClassName, progress }: ImageFieldProps) {
  const [cleared, setCleared] = useState(false);
  const [hasFile, setHasFile] = useState(false);

  return (
    <div>
      <span className="text-sm text-slate-700">{label}</span>
      {currentUrl && !hasFile && !cleared && (
        <div className="mt-1 flex items-center gap-3">
          <img src={currentUrl} alt="Current image" className={`${previewClassName} rounded object-cover`} />
          <button type="button" onClick={() => setCleared(true)} className="text-sm text-red-700 hover:underline">
            Remove
          </button>
        </div>
      )}
      {cleared && !hasFile && (
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          Image will be removed.
          <button type="button" onClick={() => setCleared(false)} className={buttonClass("ghost", "sm")}>
            Undo
          </button>
        </p>
      )}
      <input type="hidden" name={clearName} value={cleared && !hasFile ? "1" : ""} />
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          setHasFile((e.target.files?.length ?? 0) > 0);
          setCleared(false);
        }}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:text-slate-700 hover:file:bg-slate-200"
      />
      {progress !== null && progress < 100 && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200" role="progressbar" aria-valuenow={progress}>
          <div className="h-full bg-slate-900 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

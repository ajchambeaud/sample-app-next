import { cn } from "@/lib/utils";

interface ImageBoxProps {
  src: string | null;
  alt: string;
  fallback: string;
  className?: string;
  children?: React.ReactNode;
}

/** Image with a neutral placeholder when there is no picture. */
export function ImageBox({ src, alt, fallback, className, children }: ImageBoxProps) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-slate-100", className)}>
      {children}
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <span className="text-sm text-slate-400">{fallback}</span>}
    </div>
  );
}

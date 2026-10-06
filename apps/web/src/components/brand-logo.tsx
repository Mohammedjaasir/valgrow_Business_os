import valgrowMark from "@/assets/valgrow-mark.png";
import { cn } from "@/lib/utils";

/** ValGrow "VG" mark (temporary logo). Height is set by the caller; width follows the aspect ratio. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src={valgrowMark}
      alt="ValGrow"
      draggable={false}
      className={cn("h-6 w-auto shrink-0 select-none object-contain", className)}
    />
  );
}

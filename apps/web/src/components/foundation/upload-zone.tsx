import { useState } from "react";
import { File, FileText, ImageIcon, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const demoFiles = [
  { name: "brand-guidelines.pdf", size: "2.4 MB", kind: "pdf" },
  { name: "workspace-cover.png", size: "840 KB", kind: "image" },
  { name: "onboarding-notes.txt", size: "12 KB", kind: "text" },
];

const iconFor = (kind: string) =>
  kind === "image" ? ImageIcon : kind === "text" ? FileText : File;

export function UploadZone() {
  const [hover, setHover] = useState(false);
  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setHover(false);
        }}
        className={`flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center transition-colors ${
          hover ? "border-primary bg-primary-soft/50" : "border-border bg-surface-2/40"
        }`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-surface text-primary shadow-xs"><UploadCloud className="h-5 w-5" /></span>
        <p className="text-sm font-semibold">Drop files here</p>
        <p className="text-xs text-muted-foreground">
          Presentational uploader — no files are stored.
        </p>
        <Button size="sm" variant="outline" className="mt-2">
          Browse files
        </Button>
      </div>

      <div className="space-y-2">
        {demoFiles.map((f) => {
          const Icon = iconFor(f.kind);
          return (
            <div
              key={f.name}
              className="flex items-center gap-3 rounded-lg border bg-surface p-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.size}</p>
                <Progress value={100} className="mt-2 h-1" />
              </div>
              <Button size="icon" variant="ghost" aria-label={`Remove ${f.name}`}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navGroups } from "@/lib/nav";

export function CommandPalette({
  open,
  onOpenChange,
  disabled = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Ignore the Ctrl/Cmd+K shortcut (e.g. while the product tour is running). */
  disabled?: boolean;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, disabled]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, settings and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {navGroups.map((group, gi) => (
          <div key={group.label}>
            <CommandGroup heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={`${group.label}-${item.title}`}
                  value={`${group.label} ${item.title}`}
                  disabled={item.soon === true}
                  onSelect={() => {
                    onOpenChange(false);
                    navigate({ to: item.url });
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                  {item.soon ? (
                    <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
            {gi < navGroups.length - 1 ? <CommandSeparator /> : null}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

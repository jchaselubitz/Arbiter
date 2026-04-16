import * as React from "react";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { openInFinder } from "../../lib/tauriClient";

interface OpenInFinderButtonProps {
  path: string;
  className?: string;
  label?: string;
}

function OpenInFinderButton({ path, className, label = "Open in Finder" }: OpenInFinderButtonProps) {
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await openInFinder(path);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={className}
      aria-label={label}
    >
      <FolderOpen className="h-4 w-4" aria-hidden />
      <span>{loading ? "Opening..." : label}</span>
    </Button>
  );
}

export { OpenInFinderButton };

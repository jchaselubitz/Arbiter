import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { checkForUpdate } from './updaterClient';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function usePeriodicUpdateCheck({
  intervalMs = SIX_HOURS_MS
}: {
  intervalMs?: number;
} = {}) {
  const lastToastVersion = useRef<string | null>(null);

  const run = useCallback(async () => {
    try {
      const result = await checkForUpdate();
      if (result.kind === 'no-update') {
        return;
      }
      const { version } = result.update;
      if (lastToastVersion.current === version) {
        return;
      }
      lastToastVersion.current = version;
      toast.message(`Arbiter ${version} is available`, {
        description: 'Open Settings → About to download and install.'
      });
    } catch {
      // Ignore failed background checks (offline, DNS, or unset update manifest URL).
    }
  }, []);

  useEffect(() => {
    void run();
    const timer = window.setInterval(() => {
      void run();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, run]);
}

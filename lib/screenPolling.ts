// One request at a time; callers stop this loop when their screen loses focus.
export function startScreenPolling(task: (signal: AbortSignal) => Promise<void>, intervalMs: number) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  let delay = intervalMs;
  const run = async () => {
    if (controller.signal.aborted) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      timer = setTimeout(run, intervalMs);
      return;
    }
    try {
      await task(controller.signal);
      delay = intervalMs;
    } catch (error: any) {
      const retryAfter = error?.response?.headers?.['retry-after'];
      if (error?.response?.status === 429) {
        const seconds = Number(retryAfter);
        const dateDelay = Date.parse(retryAfter) - Date.now();
        delay = retryAfter && Number.isFinite(seconds) ? Math.max(1000, seconds * 1000)
          : Number.isFinite(dateDelay) && dateDelay > 0 ? dateDelay : 60000;
      } else delay = Math.min(Math.max(delay * 2, intervalMs), 60000);
    }
    if (!controller.signal.aborted) timer = setTimeout(run, delay);
  };
  timer = setTimeout(run, intervalMs);
  return () => { controller.abort(); clearTimeout(timer); };
}

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  onExpire?: () => void;
}

/**
 * Counts down from `durationSeconds` to zero. Calling `restart` resets the
 * timer back to the full duration and kicks off a fresh interval, so it can be
 * reused across resends.
 */
export function useCountdown(
  durationSeconds: number,
  options?: UseCountdownOptions,
) {
  const [runId, setRunId] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const onExpireRef = useRef(options?.onExpire);
  onExpireRef.current = options?.onExpire;

  const restart = useCallback(() => {
    setSecondsLeft(durationSeconds);
    setRunId((id) => id + 1);
  }, [durationSeconds]);

  useEffect(() => {
    setSecondsLeft(durationSeconds);
  }, [durationSeconds, runId]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) {
          clearInterval(id);
          onExpireRef.current?.();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [runId]);

  return {
    secondsLeft,
    isExpired: secondsLeft <= 0,
    restart,
  };
}

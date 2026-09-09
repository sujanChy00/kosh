import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

interface UseCountdownOptions {
  onExpire?: () => void;
}

function computeSecondsLeft(endTime: number): number {
  return Math.max(0, Math.round((endTime - Date.now()) / 1000));
}

/**
 * Counts down from `durationSeconds` to zero, based on a fixed end
 * timestamp rather than tick-counting — so it stays correct even if the
 * app is backgrounded and JS timers are paused/throttled while away.
 * Calling `restart` resets the timer back to the full duration.
 */
export function useCountdown(
  durationSeconds: number,
  options?: UseCountdownOptions,
) {
  const [runId, setRunId] = useState(0);
  const endTimeRef = useRef<number>(Date.now() + durationSeconds * 1000);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    computeSecondsLeft(endTimeRef.current),
  );
  const onExpireRef = useRef(options?.onExpire);
  onExpireRef.current = options?.onExpire;

  const restart = useCallback(() => {
    endTimeRef.current = Date.now() + durationSeconds * 1000;
    setSecondsLeft(durationSeconds);
    setRunId((id) => id + 1);
  }, [durationSeconds]);

  // Reset the end timestamp whenever duration or runId changes.
  useEffect(() => {
    endTimeRef.current = Date.now() + durationSeconds * 1000;
    setSecondsLeft(computeSecondsLeft(endTimeRef.current));
  }, [durationSeconds, runId]);

  useEffect(() => {
    const tick = () => {
      const remaining = computeSecondsLeft(endTimeRef.current);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        onExpireRef.current?.();
      }
    };

    const id = setInterval(tick, 1000);

    // Re-sync immediately whenever the app returns to the foreground,
    // instead of waiting for the next interval tick
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === "active") tick();
    };
    const subscription = AppState.addEventListener("change", onAppStateChange);

    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [runId]);

  return {
    secondsLeft,
    isExpired: secondsLeft <= 0,
    restart,
  };
}

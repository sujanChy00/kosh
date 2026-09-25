export * from "tailwind-variants";
export * from "./avatar-name";

export const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};
export const formatAmount = (amount: string) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    Number(amount),
  );

export const formatDueDay = (day: number): string => {
  const suffix = (n: number): string => {
    if (n % 100 >= 11 && n % 100 <= 13) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `Every ${day}${suffix(day)}`;
};

export const formatAmountCompact = (amount: string) => {
  const n = Number(amount);
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(2).replace(/\.00$/, "")}Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(2).replace(/\.00$/, "")}L`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return new Intl.NumberFormat("en-IN").format(n);
};

export const prettifyErrorMessage = (message?: string) => {
  if (!message) return null;

  const parsed = JSON.parse(message);

  if (Array.isArray(parsed) && "message" in parsed[0]) return parsed[0].message;

  if ("message" in parsed) return parsed.message;
  return message;
};

export function progressPercent(
  principal: string | null,
  remaining: string | null,
) {
  if (!principal || !remaining) return 0;

  const p = parseFloat(principal ?? "");
  const r = parseFloat(remaining ?? "");

  if (!p || p <= 0) return 0;

  return Math.min(1, Math.max(0, (p - r) / p));
}

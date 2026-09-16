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

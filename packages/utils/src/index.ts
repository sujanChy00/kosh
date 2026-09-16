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

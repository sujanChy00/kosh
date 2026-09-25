export const dateFormatterWithSeparator = (date?: Date, separator = "-") => {
  if (!date) return;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return [year, month, day].join(separator);
};

export const formatShortDate = (date: Date, locale = "en-US") => {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatLongDate = (date: Date) => {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(date);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  return `${weekday}, ${formattedDate.replace(",", "")}`;
};

export const formatRemainingDays = (date: Date) => {
  const now = new Date();

  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return "Expired";
  }

  return `${days} ${days === 1 ? "day" : "days"} left`;
};

export function formatPeriodName(periodStr: string) {
  const [yearStr, monthStr] = periodStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return periodStr;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

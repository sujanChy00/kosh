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

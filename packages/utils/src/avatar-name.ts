export function getAvatarName(word?: string | null) {
  if (!word?.trim()) return;

  const parts = word.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]?.charAt(0).toUpperCase();
  }

  const first = parts[0]?.charAt(0).toUpperCase() ?? "";
  const last = parts.at(-1)?.charAt(0).toUpperCase() ?? "";

  return first + last;
}

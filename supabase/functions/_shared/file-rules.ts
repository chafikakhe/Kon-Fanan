export function fileLimit(mime: string, targetType: string): number {
  if (targetType === "announcement") return 10 * 1024 * 1024;
  if (targetType === "submission_version" && mime !== "application/pdf")
    return 10 * 1024 * 1024;
  return 20 * 1024 * 1024;
}

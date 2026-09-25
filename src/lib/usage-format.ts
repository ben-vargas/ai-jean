/**
 * Compact "session|weekly%" usage label. Backends with only a weekly window
 * (e.g. Codex) show just the weekly value.
 */
export function formatUsagePair(
  session: number | null | undefined,
  weekly: number | null | undefined
): string {
  const weeklyText = weekly == null ? '--' : `${Math.round(weekly)}`
  if (session == null && weekly != null) return `${weeklyText}%`
  const sessionText = session == null ? '--' : `${Math.round(session)}`
  return `${sessionText}|${weeklyText}%`
}

/** Model G — severity*0.4 + upvotes*0.2 + safety*0.3 + age*0.1, normalized 0–100 */
export function computePriorityScore(
  severity: number,
  upvoteCount: number,
  safetyRisk: boolean,
  createdAt: string,
): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (24 * 3600000)
  const score =
    (severity / 5) * 40 +
    Math.min(upvoteCount / 20, 1) * 20 +
    (safetyRisk ? 30 : 0) +
    Math.min(ageDays / 14, 1) * 10
  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10
}

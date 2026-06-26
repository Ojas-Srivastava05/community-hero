/** Priority score used by the routing agent (severity + safety + confidence). */
export function computePriorityScore(
  severity: number,
  safetyRisk: boolean,
  confidence: number,
): number {
  return severity * 0.4 * 20 + (safetyRisk ? 30 : 0) + confidence * 10
}

export interface RecoveryGeometry {
  viewBox: string;
  pathD?: string;
}

export function buildRecoveryFunnelGeometry(
  stages: Array<{ value: number }>,
): RecoveryGeometry {
  if (stages.length === 0) {
    return { viewBox: "0 0 900 400" };
  }

  const height = stages.length * 120 + 100;

  // Simple horizontal bar representation
  const viewBox = `0 0 900 ${height}`;

  return { viewBox };
}

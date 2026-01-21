export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-yellow-400';
  return 'text-red-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 8) return 'bg-green-400';
  if (score >= 6) return 'bg-yellow-400';
  return 'bg-red-400';
}

export function getScoreBorderColor(score: number): string {
  if (score >= 8) return 'border-green-400';
  if (score >= 6) return 'border-yellow-400';
  return 'border-red-400';
}

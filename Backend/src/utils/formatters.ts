export function formatCurrency(value: number): string {
  return value.toFixed(2);
}

export function parsePaginationParams(
  page: unknown,
  limit: unknown
): { page: number; limit: number; skip: number } {
  const p = Math.max(1, parseInt(String(page)) || 1);
  const l = Math.min(100, Math.max(1, parseInt(String(limit)) || 12));
  return { page: p, limit: l, skip: (p - 1) * l };
}

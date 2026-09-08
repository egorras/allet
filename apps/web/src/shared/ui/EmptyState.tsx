/**
 * v0 ships no demo data: a list without data says what is missing instead of
 * pretending to have content (ALLET_PLAN.md §8).
 */
export function EmptyState({ description }: { description: string }) {
  return (
    <p className="rounded border border-dashed border-line px-3 py-6 text-center text-sm text-ink-muted">
      {description}
    </p>
  )
}

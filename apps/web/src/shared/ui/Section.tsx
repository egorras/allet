interface SectionProps {
  title: string
  description?: string | undefined
  children: React.ReactNode
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="mb-4 rounded-card border border-line bg-raised p-[var(--spacing-card)]">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  )
}

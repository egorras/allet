import { PageHeader } from './PageHeader'

interface DetailShellProps {
  title: string
  description?: string | undefined
  /** Main column: the record's own sections. */
  children: React.ReactNode
  /** Side column: related records, map, and other context. */
  aside?: React.ReactNode | undefined
}

export function DetailShell({ title, description, children, aside }: DetailShellProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">{children}</div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
    </>
  )
}

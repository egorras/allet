interface FieldProps {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
}

const inputClass = 'rounded border border-line bg-raised px-2 py-1.5 text-sm text-ink'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  )
}

export function TextFilterField({
  label,
  value,
  onChange,
  placeholder,
}: FieldProps & { placeholder?: string | undefined }) {
  return (
    <Field label={label}>
      <input
        type="search"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value === '' ? undefined : event.target.value)
        }}
        className={inputClass}
      />
    </Field>
  )
}

export function DateFilterField({ label, value, onChange }: FieldProps) {
  return (
    <Field label={label}>
      <input
        type="date"
        value={value ?? ''}
        onChange={(event) => {
          onChange(event.target.value === '' ? undefined : event.target.value)
        }}
        className={inputClass}
      />
    </Field>
  )
}

export function SelectFilterField({
  label,
  value,
  onChange,
  options,
  neutralLabel,
}: FieldProps & { options: { value: string; label: string }[]; neutralLabel: string }) {
  return (
    <Field label={label}>
      <select
        value={value ?? ''}
        onChange={(event) => {
          onChange(event.target.value === '' ? undefined : event.target.value)
        }}
        className={inputClass}
      >
        <option value="">{neutralLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

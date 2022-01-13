import { HTMLInputTypeAttribute } from 'react'

const Label = ({
  children,
  label,
}: {
  children: JSX.Element
  label: string
}) => {
  return (
    <label>
      <span className="block text-sm font-semibold mb-1 text-gray-500">
        {label}
      </span>
      {children}
    </label>
  )
}

export const Input = ({
  label,
  name,
  defaultValue,
  invalid,
  describedBy,
  type = 'text',
  max,
  min,
}: {
  label: string
  name: string
  defaultValue?: string
  invalid?: boolean
  describedBy?: string
  type?: HTMLInputTypeAttribute
  max?: string
  min?: string
}) => {
  return (
    <Label label={label}>
      <input
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="w-full rounded border-gray-300 shadow-sm border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandBlue-300"
        type={type}
        max={max}
        min={min}
        name={name}
        defaultValue={defaultValue}
      />
    </Label>
  )
}

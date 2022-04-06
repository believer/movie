import React from 'react'

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
  autoFocus,
  defaultValue,
  describedBy,
  invalid,
  label,
  max,
  min,
  name,
  type = 'text',
  required,
}: React.ComponentPropsWithoutRef<'input'> & {
  describedBy?: string
  invalid?: boolean
  label: string
}) => {
  return (
    <Label label={label}>
      <input
        autoFocus={autoFocus}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="w-full rounded border-gray-300 shadow-sm border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandBlue-300"
        type={type}
        max={max}
        min={min}
        name={name}
        defaultValue={defaultValue}
        required={required}
      />
    </Label>
  )
}

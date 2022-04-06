import { SelectorIcon } from '@heroicons/react/solid'

type InputSelectProps = {
  defaultValue?: string
  name: string
  onChange?: (value: React.ChangeEvent<HTMLSelectElement>) => void
  options: Array<{ value: string; label: string }>
}

export default function InputSelect({
  defaultValue,
  name,
  options,
  onChange,
}: InputSelectProps) {
  return (
    <div className="w-32 border border-gray-200 rounded-sm relative">
      <select
        className="appearance-none w-full p-2 pl-4"
        name={name}
        defaultValue={defaultValue}
        onChange={onChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 w-4 right-2 flex items-center pointer-events-none text-gray-500">
        <SelectorIcon />
      </div>
    </div>
  )
}

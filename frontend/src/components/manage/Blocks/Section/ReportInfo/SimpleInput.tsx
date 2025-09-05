import cx from 'classnames'

const SimpleInput = ({
  id,
  className,
  defaultValue,
  disabled = false,
  label,
  onChange,
  type,
  value,
  containerClassName,
}: {
  className?: string
  defaultValue?: any
  disabled?: boolean
  id: string
  label: string
  onChange?: (event: any) => void
  type: string
  value?: any
  containerClassName?: string
}) => {
  return (
    <div className={cx('flex h-full flex-col justify-end', containerClassName)}>
      {label && (
        <label
          className="mb-2 block text-lg font-normal text-gray-900"
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        name={id}
        className={cx(
          'text-md block h-10 w-full rounded-lg border border-solid border-gray-400 bg-white p-2.5 text-gray-900 shadow-none focus:border-blue-500 focus:ring-blue-500 disabled:border-gray-400 disabled:bg-gray-200 disabled:text-gray-500',
          className,
        )}
        autoComplete="off"
        defaultValue={defaultValue}
        disabled={disabled}
        type={type}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

export default SimpleInput

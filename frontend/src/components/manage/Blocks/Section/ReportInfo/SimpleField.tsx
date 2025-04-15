import cx from 'classnames'

const SimpleField = ({
  id,
  className,
  textClassName,
  data,
  hasName,
  label,
}: {
  className?: string
  textClassName?: string
  data: string
  hasName?: boolean
  id: string
  label: string
}) => {
  return (
    <div className={className}>
      <label
        className="block text-lg font-normal text-gray-900"
        htmlFor={hasName ? id : undefined}
      >
        {label}
      </label>
      <p className={cx('my-0 text-xl font-semibold', textClassName)}>{data}</p>
      {hasName && (
        <input id={id} name={id} type="text" value={data} hidden readOnly />
      )}
    </div>
  )
}

export default SimpleField

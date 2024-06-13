import cx from 'classnames'

const CLASSESS =
  'ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2 grow'

export function Field(props) {
  const { id, children, label } = props

  return (
    <div className="my-2 flex items-center">
      <label className="inline-block w-48" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function Select(props) {
  const { id, children, className, name, ...rest } = props
  return (
    <select
      id={id}
      name={name || id}
      className={cx(CLASSESS, className)}
      {...props}
    >
      {children}
    </select>
  )
}
export function Input(props) {
  const { id, className, name, type, ...rest } = props
  return (
    <input
      id={id}
      name={name || id}
      className={cx(CLASSESS, className)}
      type={type}
      {...props}
    />
  )
}

export function FieldSelect(props) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <Select id={id} {...rest}>
        {children}
      </Select>
    </Field>
  )
}

export function FieldInput(props) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <Input id={id} {...rest} />
    </Field>
  )
}

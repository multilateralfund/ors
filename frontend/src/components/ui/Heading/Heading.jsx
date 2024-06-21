import cx from 'classnames'

export function PageHeading(props) {
  const { children, className } = props
  return (
    <h1
      className={cx(
        'm-0 text-[1.928rem] leading-[1.167] text-typography-primary',
        className,
      )}
    >
      {children}
    </h1>
  )
}

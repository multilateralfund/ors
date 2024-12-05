import cx from 'classnames'

export type Status = 'Submitted' | 'Endorsed'

interface StatusStyle {
  bgColor: string
  border?: string
  textColor: string
}

export const statusStyles: Record<Status, StatusStyle> = {
  Submitted: {
    bgColor: 'bg-white',
    border: 'border-mlfs-deepTealShade',
    textColor: 'text-mlfs-deepTealShade',
  },
  Endorsed: {
    bgColor: 'bg-primary',
    border: 'border-transparent',
    textColor: 'text-mlfs-hlYellow',
  },
}

export function StatusPill(props: { status: Status }) {
  const { status } = props

  // Get the styles for the current status
  const { bgColor, border = '', textColor } = statusStyles[status] || {}

  return (
    <div
      className={cx(
        'w-fit rounded border border-solid px-1.5 text-center text-sm font-normal uppercase',
        bgColor,
        textColor,
        border,
      )}
    >
      {status}
    </div>
  )
}

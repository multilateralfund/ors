import cx from 'classnames'

export type Status =
  | 'Agency Draft'
  | 'Approved'
  | 'Need Changes'
  | 'Rejected'
  | 'Secretariat Draft'
  | 'Submitted'

interface StatusStyle {
  bgColor: string
  border?: string
  textColor: string
}

export const statusStyles: Record<Status, StatusStyle> = {
  'Agency Draft': {
    bgColor: 'bg-white',
    border: 'border-mlfs-deepTealShade',
    textColor: 'text-mlfs-deepTealShade',
  },
  Approved: { bgColor: 'bg-secondary', textColor: 'text-white' },
  'Need Changes': {
    bgColor: 'bg-mlfs-hlYellow',
    border: 'border-transparent',
    textColor: 'text-primary',
  },
  Rejected: {
    bgColor: 'bg-gray-500',
    border: 'border-transparent',
    textColor: 'text-white',
  },
  'Secretariat Draft': {
    bgColor: 'bg-white',
    border: 'border-mlfs-deepTealShade',
    textColor: 'text-mlfs-deepTealShade',
  },
  Submitted: {
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

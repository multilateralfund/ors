import cx from 'classnames'

type Status =
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

const statusStyles: Record<Status, StatusStyle> = {
  'Agency Draft': {
    bgColor: 'bg-white',
    border: 'border-mlfs-deepTealShade',
    textColor: 'text-mlfs-deepTealShade',
  },
  Approved: { bgColor: 'bg-secondary', textColor: 'text-white' },
  'Need Changes': {
    bgColor: 'bg-white',
    border: 'border-mlfs-deepTealShade',
    textColor: 'text-mlfs-deepTealShade',
  },
  Rejected: { bgColor: 'bg-gray-500', textColor: 'text-white' },
  'Secretariat Draft': {
    bgColor: 'bg-white',
    border: 'border-mlfs-deepTealShade',
    textColor: 'text-mlfs-deepTealShade',
  },
  Submitted: { bgColor: 'bg-mlfs-deepTealShade', textColor: 'text-white' },
}

function StatusPill(props: { status: Status }) {
  const { status } = props

  // Get the styles for the current status
  const { bgColor, border = '', textColor } = statusStyles[status] || {}

  return (
    <div
      className={cx(
        'w-fit rounded border border-solid px-2 text-center text-sm font-normal uppercase',
        bgColor,
        textColor,
        border,
      )}
    >
      {status}
    </div>
  )
}

export default StatusPill

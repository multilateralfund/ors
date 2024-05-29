import cx from 'classnames'

type Status = 'Approved' | 'Draft' | 'Needs Changes' | 'Rejected' | 'Submitted'

interface StatusStyle {
  bgColor: string
  border?: string
  textColor: string
}

const statusStyles: Record<Status, StatusStyle> = {
  Approved: { bgColor: 'bg-secondary', textColor: 'text-white' },
  Draft: {
    bgColor: 'bg-white',
    border: 'border-mlfs-deepTealShade',
    textColor: 'text-mlfs-deepTealShade',
  },
  'Needs Changes': {
    bgColor: 'bg-white',
    border: 'border-mlfs-deepTealShade',
    textColor: 'text-mlfs-deepTealShade',
  },
  Rejected: { bgColor: 'bg-gray-500', textColor: 'text-white' },
  Submitted: { bgColor: 'bg-mlfs-deepTealShade', textColor: 'text-white' },
}

function StatusPill(props: { status: Status }) {
  const { status } = props

  // Get the styles for the current status
  const { bgColor, border = '', textColor } = statusStyles[status] || {}

  return (
    <div
      className={cx(
        'w-fit rounded px-2 text-center text-sm font-normal uppercase',
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

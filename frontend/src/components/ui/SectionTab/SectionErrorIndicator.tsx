import { useState } from 'react'

import Popover from '@mui/material/Popover/Popover'
import cx from 'classnames'

import { IGlobalValidationResult } from '@ors/contexts/Validation/types'

import { IoAlertCircle } from 'react-icons/io5'

export default function SectionErrorIndicator({
  className,
  errors,
}: {
  className?: string
  errors: IGlobalValidationResult[]
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <div>
      <div
        className={cx('cursor-help text-red-950 hover:text-white', className)}
        onMouseEnter={(event) => {
          setAnchorEl(event?.currentTarget)
          setShowTooltip(true)
        }}
        onMouseLeave={() => {
          setAnchorEl(null)
          setShowTooltip(false)
        }}
      >
        <IoAlertCircle />
      </div>
      <Popover
        anchorEl={anchorEl}
        open={showTooltip}
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        slotProps={{
          paper: {
            className: 'border-none shadow-lg',
          },
        }}
        sx={{
          pointerEvents: 'none',
        }}
        transformOrigin={{
          horizontal: 'left',
          vertical: 'top',
        }}
        disableRestoreFocus
      >
        <div className="bg-red-950 px-4 py-2 text-white">
          {errors.map((err, idx) => (
            <div key={idx}>{err.message}</div>
          ))}
        </div>
      </Popover>
    </div>
  )
}

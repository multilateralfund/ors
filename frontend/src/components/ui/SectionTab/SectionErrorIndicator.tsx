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
        className={cx('cursor-help', className)}
        onMouseEnter={(event) => {
          setAnchorEl(event?.currentTarget)
          setShowTooltip(true)
        }}
        onMouseLeave={() => {
          setAnchorEl(null)
          setShowTooltip(false)
        }}
      >
        <IoAlertCircle className="rounded-full bg-[#002A3C]" color="#EBFF00" />
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
        <div className="bg-mlfs-bannerColor">
          <div className="border-0 border-b border-solid border-gray-300 px-2 py-2">
            This section contains incomplete or invalid data.
          </div>
          {errors.map((err, idx) => {
            return (
              <div key={idx} className="px-2 py-2">
                {'\u2022'} {err.message}
              </div>
            )
          })}
        </div>
      </Popover>
    </div>
  )
}

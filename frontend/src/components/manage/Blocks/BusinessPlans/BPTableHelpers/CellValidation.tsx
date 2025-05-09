import { useState } from 'react'

import Popover from '@mui/material/Popover/Popover'
import cx from 'classnames'

import { IoAlertCircle } from 'react-icons/io5'

export default function CellValidation({ errors }: { errors: string[] }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <div className="absolute bottom-1/3 right-1">
      <div className="flex items-center">
        <div
          className={cx('cursor-pointer', {
            'tooltip-visible': showTooltip,
          })}
          onMouseEnter={(event) => {
            setAnchorEl(event?.currentTarget)
            setShowTooltip(true)
          }}
          onMouseLeave={() => {
            setAnchorEl(null)
            setShowTooltip(false)
          }}
        >
          <IoAlertCircle
            className="rounded-full bg-[#002A3C]"
            color="#EBFF00"
            size={14}
          />
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
          <div className="bg-mlfs-bannerColor px-4 py-2">
            {errors.map((err: string, idx: number) => (
              <div key={idx}>
                {'\u2022'} {err}
              </div>
            ))}
          </div>
        </Popover>
      </div>
    </div>
  )
}

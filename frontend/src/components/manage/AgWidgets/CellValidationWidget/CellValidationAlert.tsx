import { useContext, useState } from 'react'

import Popover from '@mui/material/Popover/Popover'

import ValidationContext from '@ors/contexts/Validation/ValidationContext'
import { ValidateSectionResultValue } from '@ors/contexts/Validation/types'

import { IoAlertCircle } from 'react-icons/io5'

export default function CellValidationAlert({
  errors,
}: {
  errors: ValidateSectionResultValue[]
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const validation = useContext(ValidationContext)

  return (
    <div>
      <div
        className="cursor-pointer"
        onClick={() => validation.setOpenDrawer((prev) => !prev)}
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
          size={24}
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
          {errors.map((err, idx) => (
            <div key={idx}>
              {'\u2022'} {err.message}
            </div>
          ))}
        </div>
      </Popover>
    </div>
  )
}

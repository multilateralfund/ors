import type { ProjectFieldHistoryValue } from '@ors/types/store'

import { useState } from 'react'

import Popover from '@mui/material/Popover/Popover'
import cx from 'classnames'

export default function FieldHistoryIndicator({
  className,
  history = [],
}: {
  className?: string
  history?: ProjectFieldHistoryValue[]
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const getItemValue = (value: any): any => {
    if (typeof value === 'object' && value.hasOwnProperty('title')) {
      return value.title
    } else if (typeof value === 'object' && value.hasOwnProperty('name')) {
      return value.name
    } else if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    } else if (Array.isArray(value)) {
      return value.map((v) => getItemValue(v)).join(', ')
    }
    return value
  }

  const historicValues =
    history.reduce((acc, item) => {
      acc.add(getItemValue(item.value))
      return acc
    }, new Set()) ?? new Set()

  // At least two different values in history.
  const hasHistory = historicValues.size > 1

  const currentValue = getItemValue(history?.[0]?.value)
  let firstDifferentValue = -1
  let firstDifferentIndex = -1
  for (let i = 0; i < history.length; i++) {
    const itemValue = getItemValue(history?.[i].value)
    if (itemValue !== currentValue) {
      firstDifferentValue = itemValue
      firstDifferentIndex = i
      break
    }
  }

  return hasHistory ? (
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
        <span className="rounded border border-solid border-gray-400 bg-gray-200 px-0.5 px-1">
          {firstDifferentValue}
        </span>
      </div>
      <Popover
        anchorEl={anchorEl}
        open={showTooltip}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'top',
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
        <div className="bg-primary text-white">
          {history.map((item, idx) => {
            let label
            if (item.version > 3) {
              label = `Version ExCom ${item.post_excom_meeting}`
            } else {
              label = `Version ${item.version}`
            }
            return (
              <div
                key={idx}
                className={cx(
                  'flex items-center justify-between gap-4 px-2 py-2',
                  {
                    'text-mlfs-hlYellow': idx < firstDifferentIndex,
                    'text-red-200': idx === firstDifferentIndex,
                    'text-blue-400': idx > firstDifferentIndex,
                  },
                )}
              >
                <div>{label}</div>
                <div>{getItemValue(item.value) ?? '-'}</div>
              </div>
            )
          })}
        </div>
      </Popover>
    </div>
  ) : null
}

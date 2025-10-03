import { useState } from 'react'

import type { ProjectFieldHistoryValue } from '@ors/types/store'

import Popover from '@mui/material/Popover/Popover'
import { FaClockRotateLeft } from 'react-icons/fa6'
import { lowerCase } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'

export default function FieldHistoryIndicator({
  fieldName,
  className,
  history = [],
}: {
  fieldName: string
  className?: string
  history?: ProjectFieldHistoryValue[]
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const getItemValue = (value: any): any => {
    if (lowerCase(fieldName).includes('date') && dayjs(value).isValid()) {
      return dayjs(value).format('DD/MM/YYYY')
    } else if (
      value &&
      typeof value === 'object' &&
      value?.hasOwnProperty('title')
    ) {
      return value?.title
    } else if (
      value &&
      typeof value === 'object' &&
      value?.hasOwnProperty('name')
    ) {
      return value?.name
    } else if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    } else if (Array.isArray(value)) {
      return value.map((v) => getItemValue(v)).join(', ')
    }
    return value
  }

  const filteredHistory = history.filter(
    ({ version, post_excom_meeting }) => version === 3 || !!post_excom_meeting,
  )

  const latestByMeeting = Object.values(
    filteredHistory.reduce(
      (acc, item) => {
        const key = item.post_excom_meeting ?? '-'
        if (!acc[key] || item.version > acc[key].version) {
          acc[key] = item
        }
        return acc
      },
      {} as Record<string, any>,
    ),
  )

  const historicValues =
    latestByMeeting.reduce((acc, item) => {
      acc.add(getItemValue(item.value))
      return acc
    }, new Set()) ?? new Set()

  // At least two different values in history.
  const hasHistory = historicValues.size > 1

  const currentValue = getItemValue(latestByMeeting?.[0]?.value)
  let firstDifferentValue = -1
  let firstDifferentIndex = -1
  for (let i = 0; i < latestByMeeting.length; i++) {
    const itemValue = getItemValue(latestByMeeting?.[i].value)
    if (itemValue !== currentValue) {
      firstDifferentValue = itemValue
      firstDifferentIndex = i
      break
    }
  }

  return hasHistory ? (
    // <div className="bg-primary text-white">
    <div>
      {latestByMeeting.map((item, idx) => {
        let label
        if (item.version > 3) {
          label = `${fieldName} (updated ExCom ${item.post_excom_meeting})`
        } else {
          label = `${fieldName} (planned)`
        }
        return (
          <div
            key={idx}
            className={cx('flex items-center gap-4 py-1', {
              italic: idx >= firstDifferentIndex,
              // 'text-mlfs-hlYellow': idx < firstDifferentIndex,
              // 'text-red-200': idx === firstDifferentIndex,
              // 'text-blue-400': idx > firstDifferentIndex,
            })}
          >
            <div>{label}:</div>
            <h4 className="m-0">{getItemValue(item.value) ?? '-'}</h4>
          </div>
        )
      })}
    </div>
  ) : null
  {
    /* <div
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
        <div className="rounded border border-solid border-gray-400 bg-gray-200 px-0.5 py-1">
          <FaClockRotateLeft />
        </div>
      </div> */
  }
  {
    /* <Popover
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

      </Popover>
    </div>
  ) : null */
  }
}

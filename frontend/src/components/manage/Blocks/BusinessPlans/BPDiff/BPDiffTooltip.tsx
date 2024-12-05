import { Divider, Tooltip } from '@mui/material'
import cx from 'classnames'

import { useStore } from '@ors/store'

const BPDiffTooltip = (props: any) => {
  const { extraTooltipData, new_value, old_value } = props

  const { currentVersion, previousVersion } = useStore(
    (state) => state.bp_diff_versions,
  )

  const formatValues = (value: any) =>
    Array.isArray(value)
      ? value.length > 0
        ? value.map((val: any, index: number) => (
            <span key={index} className="whitespace-nowrap pl-2">
              {val}
            </span>
          ))
        : '-'
      : value

  const formatted_new_value = formatValues(new_value) || '-'
  const formatted_old_value = formatValues(old_value) || '-'

  const getCellValue = (value: any) => (
    <span className="overflow-auto pr-1">{value}</span>
  )

  const commentsTooltip = (value: { comment: string }) => {
    const { comment } = value || {}

    return comment ? (
      <div className="overflow-auto pr-1">
        <div>{comment}</div>
      </div>
    ) : (
      '-'
    )
  }

  return (
    <div className="spacing-11 flex flex-col gap-1">
      {[formatted_new_value, formatted_old_value].map((value, index) => (
        <div key={index}>
          <div
            className={cx('flex max-h-40 gap-1', {
              'mb-1.5': index === 0,
              'mt-1.5 text-gray-300': index === 1,
            })}
          >
            <span
              className="whitespace-nowrap uppercase"
              style={{ minWidth: 8 + currentVersion.toString().length + 'ch' }}
            >
              {index === 0
                ? `Version ${currentVersion || ''}`
                : `Version ${previousVersion || ''}`}
            </span>
            <span className="min-w-1">-</span>
            {typeof value === 'object' && !Array.isArray(value) ? (
              commentsTooltip(value)
            ) : extraTooltipData ? (
              <Tooltip
                className="bp-tooltip"
                TransitionProps={{ timeout: 0 }}
                classes={{ tooltip: 'bp-table-tooltip' }}
                placement={'top'}
                title={
                  index === 0
                    ? extraTooltipData['new_value']
                    : extraTooltipData['old_value']
                }
              >
                {getCellValue(value)}
              </Tooltip>
            ) : (
              getCellValue(value)
            )}
          </div>
          {index === 0 && <Divider />}
        </div>
      ))}
    </div>
  )
}

export default BPDiffTooltip

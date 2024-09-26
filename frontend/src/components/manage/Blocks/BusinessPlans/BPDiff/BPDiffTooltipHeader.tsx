import { Divider, Tooltip, Typography } from '@mui/material'

import { truncateText } from '@ors/components/manage/Utils/diffUtils'
import { useStore } from '@ors/store'

const BPDiffTooltipHeader = (props: any) => {
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
    <span className="overflow-auto">{value}</span>
  )

  const commentsTooltip = (value: {
    comment: string
    comment_types: Array<string>
  }) => {
    const { comment, comment_types } = value || {}

    return comment || comment_types?.length > 0 ? (
      <div className="overflow-auto">
        <div className="flex flex-wrap gap-1">
          {comment_types?.map((commType: string, index: number) => (
            <Tooltip
              key={index}
              TransitionProps={{ timeout: 0 }}
              title={commType}
              classes={{
                tooltip: 'bp-table-tooltip',
              }}
            >
              <Typography
                className="inline-flex cursor-default items-center gap-2 rounded bg-gray-100 px-1 text-xs font-normal text-gray-A700"
                component="p"
                variant="h6"
              >
                {truncateText(commType, 30)}
              </Typography>
            </Tooltip>
          ))}
        </div>
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
          <div className="flex max-h-40 gap-1">
            <span className="min-w-15 whitespace-nowrap">
              {index === 0
                ? currentVersion && `Version ${currentVersion} -`
                : previousVersion && `Version ${previousVersion} - `}
            </span>
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

export default BPDiffTooltipHeader

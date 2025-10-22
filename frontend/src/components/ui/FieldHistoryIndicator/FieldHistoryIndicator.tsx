import {
  filterHistoryField,
  getHistoryItemValue,
  getLatesValueByMeeting,
  hasExcomUpdate,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import type { ProjectFieldHistoryValue } from '@ors/types/store'

import cx from 'classnames'

export default function FieldHistoryIndicator({
  fieldName,
  history = [],
}: {
  fieldName: string
  history?: ProjectFieldHistoryValue[]
}) {
  const filteredHistory = filterHistoryField(history)
  const latestByMeeting = getLatesValueByMeeting(filteredHistory)

  const currentValue = getHistoryItemValue(
    latestByMeeting?.[0]?.value,
    fieldName,
  )
  let firstDifferentIndex = -1
  for (let i = 0; i < latestByMeeting.length; i++) {
    const itemValue = getHistoryItemValue(latestByMeeting?.[i].value, fieldName)
    if (itemValue !== currentValue) {
      firstDifferentIndex = i
      break
    }
  }

  return hasExcomUpdate(history, fieldName) ? (
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
            className={cx('flex items-center gap-4 pb-1', {
              italic: idx >= firstDifferentIndex,
            })}
          >
            <div>{label}:</div>
            <h4 className="m-0">
              {getHistoryItemValue(item.value, fieldName) ?? '-'}
            </h4>
          </div>
        )
      })}
    </div>
  ) : null
}

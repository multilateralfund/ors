import { detailItemExtra } from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ViewHelperComponents'
import {
  filterHistoryField,
  getFormattedNumericValue,
  getHistoryItemValue,
  getLatesValueByMeeting,
  hasExcomUpdate,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import type { ProjectFieldHistoryValue } from '@ors/types/store'

import { isNull } from 'lodash'
import cx from 'classnames'

type FormattedDataType = 'text' | 'number' | 'other'
type ExtraPropsType =
  | { type: 'text'; extra?: detailItemExtra }
  | { type: 'number'; dataType: string }
  | { type: 'other'; className?: string }

export default function FieldHistoryIndicator({
  fieldName,
  dataType,
  history = [],
  extra,
  className,
}: {
  fieldName: string
  dataType: string
  history?: ProjectFieldHistoryValue[]
  extra?: detailItemExtra
  className?: string
}) {
  const formattedDataType = ['boolean', 'date'].includes(dataType)
    ? 'other'
    : dataType === 'text'
      ? dataType
      : 'number'

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

        const historicValue = getHistoryItemValue(item.value, fieldName)
        const value =
          dataType === 'boolean' && isNull(historicValue)
            ? 'No'
            : formattedDataType !== 'number'
              ? (historicValue ?? '')
              : historicValue

        const extraPropsMap: Record<FormattedDataType, ExtraPropsType> = {
          text: { type: 'text', extra },
          number: { type: 'number', dataType },
          other: { type: 'other', className },
        }

        return (
          <span key={idx} className="flex items-center gap-4 pb-1">
            {historyViewModesHandler[formattedDataType](
              label,
              value,
              idx >= firstDifferentIndex,
              extraPropsMap[formattedDataType],
            )}
          </span>
        )
      })}
    </div>
  ) : null
}

const historyViewModesHandler: Record<
  FormattedDataType,
  (
    label: string,
    value: string,
    isTitleItalic: boolean,
    extraProps: ExtraPropsType,
  ) => React.ReactNode
> = {
  text: (label, value, isTitleItalic, extraProps) =>
    extraProps.type === 'text'
      ? detailItem(label, value, isTitleItalic, extraProps.extra)
      : null,
  number: (label, value, isTitleItalic, extraProps) =>
    extraProps.type === 'number'
      ? numberDetailItem(label, value, isTitleItalic, extraProps.dataType)
      : null,
  other: (label, value, isTitleItalic, extraProps) =>
    extraProps.type === 'other'
      ? otherDetailItem(label, value, isTitleItalic, extraProps.className)
      : null,
}

const detailItem = (
  label: string,
  value: string,
  isTitleItalic: boolean,
  extra?: detailItemExtra,
) => {
  const { detailClassname, classNames } = extra ?? {}
  const {
    containerClassName = '',
    className = '',
    fieldClassName = '',
  } = classNames ?? {}

  return (
    <span
      className={cx('flex gap-2', containerClassName, {
        italic: isTitleItalic,
      })}
    >
      <span className={cx(detailClassname, className)}>{label}</span>
      <h4 className={cx('m-0', fieldClassName)}>{value || '-'}</h4>
    </span>
  )
}

const numberDetailItem = (
  label: string,
  value: string,
  isTitleItalic: boolean,
  dataType: string,
) => (
  <span className={cx('flex gap-2', { italic: isTitleItalic })}>
    <span>{label}</span>
    <h4 className="m-0">
      {getFormattedNumericValue(value, dataType === 'decimal' ? 2 : 0)}
    </h4>
  </span>
)

const otherDetailItem = (
  label: string,
  value: string,
  isTitleItalic: boolean,
  className?: string,
) => (
  <span className={cx('flex gap-2', className, { italic: isTitleItalic })}>
    <span>{label}</span>
    <h4 className="m-0">{value}</h4>
  </span>
)

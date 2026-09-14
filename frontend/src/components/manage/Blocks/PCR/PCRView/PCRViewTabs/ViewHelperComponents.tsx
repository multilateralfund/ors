import { getFormattedNumericValue } from '@ors/components/manage/Blocks/ProjectsListing/utils'

import cx from 'classnames'
import dayjs from 'dayjs'

export const detailItem = (
  fieldName: string,
  fieldValue: string,
  classname?: string,
) => (
  <span className="flex gap-2">
    <span className={classname}>{fieldName}</span>
    <h4 className="m-0">{fieldValue || '-'}</h4>
  </span>
)

export const numberDetailItem = (
  fieldName: string,
  fieldValue: string,
  dataType: string,
) => (
  <span className="flex gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {getFormattedNumericValue(fieldValue, dataType === 'decimal' ? 2 : 0)}
    </h4>
  </span>
)

export const booleanDetailItem = (
  fieldName: string,
  fieldValue: boolean | null | undefined,
) => (
  <span className="flex gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {fieldValue == null ? '-' : fieldValue ? 'Yes' : 'No'}
    </h4>
  </span>
)

export const dateDetailItem = (fieldName: string, fieldValue: string) => (
  <span className="flex gap-2">
    <span>{fieldName}</span>
    <h4 className="m-0">
      {(fieldValue && dayjs(fieldValue).format('DD/MM/YYYY')) || '-'}
    </h4>
  </span>
)

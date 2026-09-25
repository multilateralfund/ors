import { ReactNode } from 'react'

import { getFormattedNumericValue } from '@ors/components/manage/Blocks/ProjectsListing/utils'

import { Divider } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <div className="text-[28px] font-medium text-[#002A3C]">{children}</div>
)

export const SubSectionTitle = ({ children }: { children: ReactNode }) => (
  <div className="mb-6 text-lg uppercase tracking-[1px] text-typography-sectionTitle">
    {children}
  </div>
)

export const detailItem = (
  fieldName: string,
  fieldValue: string,
  classname?: Record<string, string>,
  withDivider?: boolean,
) => {
  const { containerClassname, labelClassname, valueClassname } = classname ?? {}

  return (
    <span className={cx('flex flex-col gap-1', containerClassname)}>
      <span className={cx('text-[#4D4D4D]', labelClassname)}>{fieldName}</span>
      {withDivider && <Divider className="my-4" />}
      <h4
        className={cx('m-0 text-xl font-semibold text-primary', valueClassname)}
      >
        {fieldValue || '-'}
      </h4>
    </span>
  )
}

export const numberDetailItem = (
  fieldName: string,
  fieldValue: string,
  dataType: string,
  className?: string,
) => (
  <span className="flex flex-col gap-1">
    <span className="text-[#4D4D4D]">{fieldName}</span>
    <h4 className={cx('m-0 text-xl font-semibold text-primary', className)}>
      {getFormattedNumericValue(fieldValue, dataType === 'decimal' ? 2 : 0)}
    </h4>
  </span>
)

export const booleanDetailItem = (
  fieldName: string,
  fieldValue: boolean | null | undefined,
) => (
  <span className="flex flex-col gap-1">
    <span className="text-[#4D4D4D]">{fieldName}</span>
    <h4 className="m-0 text-xl font-semibold text-primary">
      {fieldValue == null ? '-' : fieldValue ? 'Yes' : 'No'}
    </h4>
  </span>
)

export const dateDetailItem = (fieldName: string, fieldValue: string) => (
  <span className="flex flex-col gap-1">
    <span className="text-[#4D4D4D]">{fieldName}</span>
    <h4 className="m-0 text-xl font-semibold text-primary">
      {(fieldValue && dayjs(fieldValue).format('DD/MM/YYYY')) || '-'}
    </h4>
  </span>
)

import { ReactNode, useState } from 'react'

import { getFormattedNumericValue } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import {
  borderedContainerClassname,
  borderedValueClassname,
} from '../../constants'
import { ProjectType } from '@ors/types/api_projects'

import { IoChevronDown, IoChevronUp } from 'react-icons/io5'
import { Divider, Popover } from '@mui/material'
import { FiEdit3, FiInfo } from 'react-icons/fi'
import { FaCheck } from 'react-icons/fa6'
import cx from 'classnames'
import dayjs from 'dayjs'

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <div className="text-[28px] font-medium text-[#002A3C]">{children}</div>
)

export const SubSectionTitle = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={cx(
      'mb-0 content-center text-lg font-bold uppercase tracking-[1px] text-primary',
      className,
    )}
  >
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
  classname?: Record<string, string>,
) => {
  const { labelClassname, valueClassname } = classname ?? {}

  return (
    <span className="flex flex-row items-center gap-4">
      <span className={cx('text-[#4D4D4D]', labelClassname)}>{fieldName}</span>
      <h4
        className={cx(
          'm-0 text-xl font-semibold text-primary',
          borderedValueClassname,
          valueClassname,
        )}
      >
        {fieldValue ? 'Yes' : 'No'}
      </h4>
    </span>
  )
}

export const dateDetailItem = (fieldName: string, fieldValue: string) => (
  <span className="flex flex-col gap-1">
    <span className="text-[#4D4D4D]">{fieldName}</span>
    <h4 className="m-0 text-xl font-semibold text-primary">
      {(fieldValue && dayjs(fieldValue).format('DD/MM/YYYY')) || '-'}
    </h4>
  </span>
)

export const getCollapseIcon = (isSectionExpanded: boolean) =>
  isSectionExpanded ? (
    <IoChevronUp className="cursor-pointer" color="#002B3D" size="24" />
  ) : (
    <IoChevronDown className="cursor-pointer" color="#002B3D" size="24" />
  )

export const ProjectSummary = ({ project }: { project: ProjectType }) => {
  const projectDataMapping = [
    { label: 'Type', value: project.project_type },
    { label: 'Sector', value: project.sector },
    { label: 'Agency', value: project.agency },
    { label: 'Tranche(s)', value: project.tranche },
  ]

  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
      {projectDataMapping.map((entry) => (
        <div className="flex items-center gap-1.5 text-base">
          <span className="font-normal text-[#fffc]">{entry.label}:</span>
          <span className="rounded border border-solid px-1 py-0.5 font-medium leading-tight">
            {entry.value ?? '-'}
          </span>
        </div>
      ))}
    </div>
  )
}

export const EditSectionIndicator = () => (
  <div className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-3 py-1 text-lg leading-none text-mlfs-hlYellow">
    <FiEdit3 size={18} />
    <span>Edit</span>
  </div>
)

export const UserInfo = ({ info }: { info: string }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <>
      <div
        className="mt-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-[#D1D5DB] bg-white text-2xl text-[#9a2b2b]"
        onClick={(event) => setAnchorEl(anchorEl ? null : event.currentTarget)}
      >
        <span className="mt-1">*</span>
      </div>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#f6f9d9',
              border: '1px solid #f0f2ce',
              borderRadius: '8px !important',
              fontSize: '16px',
              ml: 2.25,
              px: 1.25,
              py: 0.5,
            },
          },
        }}
      >
        {info}
      </Popover>
    </>
  )
}

export const EntryIndex = ({ index }: { index: number }) => (
  <div className="flex h-6 min-h-6 w-6 min-w-6 items-center justify-center justify-self-center rounded-full bg-primary text-lg text-[#EBFF00]">
    {index + 1}
  </div>
)

export const NoDataReported = ({
  text,
  additionalText,
}: {
  text: string
  additionalText?: string
}) => (
  <div
    className={cx(
      'flex w-fit items-center gap-1 rounded bg-[#edf1f4] p-3 text-lg leading-none',
      borderedContainerClassname,
    )}
  >
    <FiInfo size={18} className="mr-1.5" />
    <div className="font-semibold text-primary">{text}</div>
    <div className="text-[#333]">{additionalText}</div>
  </div>
)

export const SelectedEntity = (entity: string) => (
  <h4
    className={cx(
      borderedValueClassname,
      'm-0 flex flex-row items-center gap-2 rounded-full border-primary bg-primary !p-2 !font-normal !leading-none text-white',
    )}
  >
    <FaCheck size={12} color="#bdcb19" />
    {entity}
  </h4>
)

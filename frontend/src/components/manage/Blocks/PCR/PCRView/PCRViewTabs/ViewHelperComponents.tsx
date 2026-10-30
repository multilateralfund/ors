import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react'

import Link from '@ors/components/ui/Link/Link'
import { getFormattedNumericValue } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRVersion } from '../../interfaces'
import {
  borderedContainerClassname,
  borderedValueClassname,
} from '../../constants'
import useClickOutside from '@ors/hooks/useClickOutside'
import { ProjectType } from '@ors/types/api_projects'

import { IoChevronDown, IoChevronUp } from 'react-icons/io5'
import { Divider, Paper, Popper } from '@mui/material'
import { FaCheck } from 'react-icons/fa6'
import { FiInfo } from 'react-icons/fi'
import { useParams } from 'wouter'
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
  withLabel: boolean = true,
) => {
  const { containerClassname, labelClassname, valueClassname } = classname ?? {}

  return (
    <span className={cx('flex flex-col gap-1', containerClassname)}>
      {withLabel && (
        <span className={cx('text-[#4D4D4D]', labelClassname)}>
          {fieldName}
        </span>
      )}
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

export const UserInfo = ({
  info,
  placement,
  className,
}: {
  info: string
  placement?: 'right' | 'bottom' | 'top' | 'left'
  className?: Record<string, string>
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const { containerClassname, labelClassname } = className ?? {}

  return (
    <>
      <div
        className={cx(
          'mr-2.25 mt-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-[#D1D5DB] bg-white text-2xl text-[#9a2b2b]',
          containerClassname,
        )}
        onMouseEnter={(event) => setAnchorEl(event.currentTarget)}
        onMouseLeave={() => setAnchorEl(null)}
      >
        <span className={cx('mt-1', labelClassname)}>*</span>
      </div>
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onMouseEnter={() => setAnchorEl(anchorEl)}
        onMouseLeave={() => setAnchorEl(null)}
        placement={placement ?? 'bottom'}
        sx={{ zIndex: 1300, maxWidth: 800 }}
        modifiers={[
          {
            name: 'offset',
            options: { offset: [0, 8] },
          },
        ]}
      >
        <Paper
          sx={{
            backgroundColor: '#f6f9d9',
            border: '1px solid #f0f2ce',
            borderRadius: '8px !important',
            fontSize: '16px',
            px: 1.25,
            py: 0.5,
          }}
        >
          {info}
        </Paper>
      </Popper>
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

export const NrEntity = (index: number) => (
  <div className="flex h-6 min-h-6 w-6 min-w-6 items-center justify-center rounded-full bg-primary text-lg font-medium text-mlfs-hlYellow">
    {index + 1}
  </div>
)

export const VersionsList = ({
  showVersionsMenu,
  setShowVersionsMenu,
}: {
  showVersionsMenu: boolean
  setShowVersionsMenu: Dispatch<SetStateAction<boolean>>
}) => {
  const { pcr, pcrVersions } = useContext(PCRDataContext)
  const { version, status, latest_pcr_id } = pcr.data ?? {}
  const versions = pcrVersions.data ?? []

  if (versions.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <VersionsDropdown
        {...{ versions, showVersionsMenu, setShowVersionsMenu }}
      />
      <span className="self-baseline whitespace-nowrap rounded bg-mlfs-hlYellow p-1 font-medium uppercase leading-none">
        {latest_pcr_id ? `Version ${version}: ${status}` : 'Latest'}
      </span>
    </div>
  )
}

const VersionsDropdown = ({
  versions,
  showVersionsMenu,
  setShowVersionsMenu,
}: {
  versions: PCRVersion[]
  showVersionsMenu: boolean
  setShowVersionsMenu: Dispatch<SetStateAction<boolean>>
}) => {
  const { project_id } = useParams<Record<string, string>>()

  const ref = useClickOutside<HTMLDivElement>(() => {
    setShowVersionsMenu(false)
  })

  const toggleShowVersionsMenu = () => setShowVersionsMenu((prev) => !prev)

  return (
    <div className="relative">
      <div
        ref={ref}
        onClick={toggleShowVersionsMenu}
        className="flex cursor-pointer items-center justify-between gap-x-2"
      >
        <IoChevronDown className="text-5xl font-bold text-gray-700" />
      </div>
      <div
        className={cx(
          'absolute left-0 z-10 max-h-[200px] origin-top overflow-y-auto rounded-none border border-solid border-primary bg-gray-A100 opacity-0 transition-all sm:left-auto sm:right-0',
          {
            'collapse scale-y-0': !showVersionsMenu,
            'scale-y-100 opacity-100': showVersionsMenu,
          },
        )}
      >
        {[...versions]
          .reverse()
          .map(({ id, version, status, latest_pcr_id }) => (
            <Link
              key={id}
              href={`/pcr/${project_id}/${id}`}
              className="flex items-center gap-x-2 rounded-none px-2 py-2 text-black no-underline hover:bg-primary hover:text-white"
            >
              <div className="flex items-center justify-between gap-2 whitespace-nowrap hover:text-white">
                <div className="ml-1">
                  Version {version}: {status}
                </div>
                {!latest_pcr_id && (
                  <span className="mx-1 rounded-md bg-gray-400 p-1 text-xs uppercase text-white">
                    Latest
                  </span>
                )}
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}

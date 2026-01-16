import React, { useEffect, useMemo, useRef, useState } from 'react'

import { Box } from '@mui/material'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput.tsx'
import { useMeetingOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import Field from '@ors/components/manage/Form/Field.tsx'
import { IoChevronDown } from 'react-icons/io5'
import { ApiFilters, RequestParams } from './types.ts'
import { initialRequestParams } from './initialData.ts'
import Link from '@ors/components/ui/Link/Link.tsx'
import { formatApiUrl } from '@ors/helpers'
import useFilters from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCompareVersions/useFilters.ts'
import { considerationOpts } from '@ors/components/manage/Blocks/ProjectsListing/constants.ts'

const defaultProps = {
  FieldProps: { className: 'mb-0 w-full' },
  popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
  componentsProps: {
    popupIndicator: {
      sx: {
        transform: 'none !important',
      },
    },
  },
}

const Filters = (props: {
  requestParams: RequestParams
  setRequestParams: React.Dispatch<React.SetStateAction<RequestParams>>
}) => {
  const { requestParams, setRequestParams } = props

  const meetings = useMeetingOptions()
  const { filterOptions } = useFilters(requestParams)

  const submissionStatusOptions = filterOptions?.submission_status ?? []
  const agencyOptions = filterOptions?.agency ?? []

  return (
    <Box className="shadow-none">
      <div className="flex w-full gap-4">
        <div className="w-full md:w-[7.76rem]">
          <Label htmlFor="meetingPopover">Meeting</Label>
          <PopoverInput
            id="meetingPopover"
            className="!m-0 mb-0 h-[2.25rem] min-h-[2.25rem] w-full truncate border-2 !py-1 !pr-0 text-[16px] md:w-[7.76rem]"
            label={
              meetings.filter((o) => o.value === requestParams.meeting_id)[0]
                ?.label ?? ''
            }
            options={meetings}
            withClear={true}
            onChange={(value: string) => {
              setRequestParams((prev) => ({
                ...prev,
                meeting_id: value ?? '',
              }))
            }}
            onClear={() => {
              setRequestParams((prev) => ({
                ...prev,
                meeting_id: '',
              }))
            }}
          />
        </div>
        <div className="w-72">
          <Label htmlFor="agencyId">Agency</Label>
          <Field
            id="agencyId"
            options={agencyOptions}
            value={
              agencyOptions.find(
                (opt) => opt.id.toString() === requestParams.agency_id,
              ) ?? null
            }
            widget="autocomplete"
            getOptionLabel={(option: any) => option?.name ?? ''}
            onChange={(_: any, value: any) => {
              setRequestParams((prev) => ({
                ...prev,
                agency_id: value?.id.toString() ?? '',
              }))
            }}
            required
            {...defaultProps}
          />
        </div>
        <div className="w-72">
          <Label htmlFor="submissionStatusLeft">Compare</Label>
          <Field
            id="submissionStatusLeft"
            options={submissionStatusOptions}
            value={
              submissionStatusOptions.find(
                (opt) =>
                  opt.id.toString() === requestParams.submission_status_left_id,
              ) ?? null
            }
            widget="autocomplete"
            getOptionLabel={(option: any) => option?.name ?? ''}
            onChange={(_: any, value: any) => {
              setRequestParams((prev) => ({
                ...prev,
                submission_status_left_id: value?.id.toString() ?? '',
              }))
            }}
            required
            {...defaultProps}
          />
        </div>
        <div className="w-72">
          <Label htmlFor="submissionStatusRight">to</Label>
          <Field
            id="submissionStatusRight"
            options={submissionStatusOptions}
            value={
              submissionStatusOptions.find(
                (opt) =>
                  opt.id.toString() ===
                  requestParams.submission_status_right_id,
              ) ?? null
            }
            widget="autocomplete"
            getOptionLabel={(option: any) => option?.name ?? ''}
            onChange={(_: any, value: any) => {
              setRequestParams((prev) => ({
                ...prev,
                submission_status_right_id: value?.id.toString() ?? '',
              }))
            }}
            required
            {...defaultProps}
          />
        </div>
      </div>
    </Box>
  )
}

const ProjectsCompareVersions = () => {
  const [requestParams, setRequestParams] = useState<RequestParams>(
    initialRequestParams(),
  )
  const downloadUrl = useMemo(() => {
    const encodedParams = new URLSearchParams(requestParams).toString()
    return formatApiUrl(`api/compare-versions/export?${encodedParams}`)
  }, [requestParams])

  return (
    <>
      <Box className="shadow-none">
        <div className="gap-2 sm:flex-wrap md:flex">
          <Filters
            requestParams={requestParams}
            setRequestParams={setRequestParams}
          />
          <Box className="border-none shadow-none">
            <div className="mt-4 flex gap-x-2">
              <Link
                button
                disabled={
                  !(
                    requestParams.meeting_id &&
                    requestParams.agency_id &&
                    requestParams.submission_status_left_id &&
                    requestParams.submission_status_right_id
                  )
                }
                size="large"
                href={downloadUrl}
                variant="contained"
              >
                Generate report
              </Link>
            </div>
          </Box>
        </div>
      </Box>
    </>
  )
}

export default ProjectsCompareVersions

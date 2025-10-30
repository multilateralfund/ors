import React from 'react'
import { useMeetingOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import { Box, Checkbox } from '@mui/material'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput.tsx'
import Field from '@ors/components/manage/Form/Field.tsx'
import { IoChevronDown } from 'react-icons/io5'
import { GlobalRequestParams } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/types.ts'
import { considerationOpts } from '../constants'

const defaultProps = {
  FieldProps: { className: 'mb-0 w-full BPListUpload' },
  popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
  componentsProps: {
    popupIndicator: {
      sx: {
        transform: 'none !important',
      },
    },
  },
}

const SummaryOfProjectsFilters = (props: {
  requestParams: GlobalRequestParams
  setRequestParams: React.Dispatch<React.SetStateAction<GlobalRequestParams>>
}) => {
  const { requestParams, setRequestParams } = props

  const meetings = useMeetingOptions()

  const submissionStatusOptions = [
    { label: 'Recommended', value: 'recommended' },
    { label: 'Approved', value: 'approved' },
  ]

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
          <Label htmlFor="submissionStatus">Submission status</Label>
          <Field
            id="submissionStatus"
            options={submissionStatusOptions}
            value={
              submissionStatusOptions.filter(
                (o) => o.value === requestParams.submission_status,
              )[0] ?? null
            }
            widget="autocomplete"
            isOptionEqualToValue={(
              option: (typeof submissionStatusOptions)[0],
              value: (typeof submissionStatusOptions)[0] | string,
            ) => {
              if (typeof value === 'string') {
                return option.value == value
              }
              return option.value === value.value
            }}
            onChange={(_: any, option: any) => {
              setRequestParams((prev) => ({
                ...prev,
                submission_status: option?.value ?? '',
              }))
            }}
            required
            {...defaultProps}
          />
        </div>
        <div>
          <Label htmlFor="blanketConsideration">
            Blanket approval/Individual consideration
          </Label>
          <Field
            widget="autocomplete"
            options={considerationOpts}
            value={
              considerationOpts.find(
                (opt) =>
                  opt.id === requestParams.blanket_or_individual_consideration,
              ) ?? null
            }
            onChange={(_, value: any) =>
              setRequestParams((prev) => ({
                ...prev,
                blanket_or_individual_consideration: value?.id ?? '',
              }))
            }
            getOptionLabel={(option: any) => option?.name ?? ''}
            {...{
              ...defaultProps,
              FieldProps: {
                className: defaultProps.FieldProps.className + ' w-[13.5rem]',
              },
            }}
          />
        </div>
      </div>
    </Box>
  )
}

export default SummaryOfProjectsFilters

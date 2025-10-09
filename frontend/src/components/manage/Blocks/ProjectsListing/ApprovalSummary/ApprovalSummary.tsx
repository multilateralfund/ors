import { Box, Button, Checkbox } from '@mui/material'
import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput.tsx'
import { useMeetingOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import Field from '@ors/components/manage/Form/Field.tsx'
import { IoChevronDown } from 'react-icons/io5'
import { useState } from 'react'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import { canEditField } from '@ors/components/manage/Blocks/ProjectsListing/utils.ts'
import useApi from '@ors/hooks/useApi.ts'
import { ApiDecision } from '@ors/types/api_meetings.ts'
import { ApiApprovalSummary } from '@ors/types/api_approval_summary.ts'

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

const initialRequestParams = () => ({
  meeting_id: '',
  submission_status: '',
  blanket_consideration: false,
  individual_consideration: true,
})

const ApprovalSummary = () => {
  const meetings = useMeetingOptions()
  const [requestParams, setRequestParams] = useState(initialRequestParams)

  const submissionStatusOptions = [
    { name: 'Recommended', value: 'recommended' },
    { name: 'Approved', value: 'approved' },
  ]

  const approvalSummaryApi = useApi<ApiApprovalSummary>({
    path: 'api/projects-approval-summary',
    options: {
      triggerIf: false,
      params: requestParams,
    },
  })

  const handleFetchPreview = () => {
    approvalSummaryApi.setParams(requestParams)
    approvalSummaryApi.setApiSettings((prevSettings) => ({
      ...prevSettings,
      options: { ...prevSettings.options, triggerIf: true },
    }))
  }

  console.log(approvalSummaryApi.data)

  return (
    <>
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
              onChange={(value: string) => {
                setRequestParams((prev) => ({
                  ...prev,
                  meeting_id: value ?? '',
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
                )[0] ?? ''
              }
              widget="autocomplete"
              getOptionLabel={(option) => option?.name ?? ''}
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
          <div className="flex-col">
            <Label htmlFor="blanketConsideration">Blanket consideration</Label>
            <Checkbox
              id="blanketConsideration"
              className="p-0"
              checked={requestParams.blanket_consideration}
              onChange={(_, value) =>
                setRequestParams((prev) => ({
                  ...prev,
                  blanket_consideration: value,
                  individual_consideration: !value,
                }))
              }
              sx={{
                color: 'black',
              }}
            />
          </div>
          <div className="flex grow flex-row-reverse items-center">
            <Button
              size="large"
              variant="contained"
              onClick={handleFetchPreview}
            >
              Preview summary
            </Button>
          </div>
        </div>
      </Box>
    </>
  )
}

export default ApprovalSummary

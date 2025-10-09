import { Box, Button, Checkbox, Divider, Typography } from '@mui/material'
import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput.tsx'
import { useMeetingOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import Field from '@ors/components/manage/Form/Field.tsx'
import { IoChevronDown } from 'react-icons/io5'
import React, { useState } from 'react'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import useApi from '@ors/hooks/useApi.ts'
import { ApiApprovalSummary } from '@ors/types/api_approval_summary.ts'
import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import { GridOptions, ICellRendererParams } from 'ag-grid-community'

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

const ApprovalSummaryPreviewTable = (props: {
  projectsData: ApiApprovalSummary['projects']
}) => {
  const { projectsData } = props

  const columnDefs: GridOptions<
    ApiApprovalSummary['projects']['data'][0]
  >['columnDefs'] = [
    {
      headerName: 'Code',
      field: 'code',
      tooltipField: 'code',
      cellRenderer: (
        params: ICellRendererParams<ApiApprovalSummary['projects']['data'][0]>,
      ) => {
        return (
          <a
            className="text-inherit no-underline"
            href={`/projects-listing/${params.data?.id}`}
            target={'_blank'}
          >
            {params.data?.code}
          </a>
        )
      },
    },
    {
      headerName: 'Status',
      field: 'status_project',
      tooltipField: 'status_project',
    },
    {
      headerName: 'Submission status',
      field: 'status_submission',
      tooltipField: 'status_submission',
    },
    {
      headerName: 'Version',
      field: 'version',
      tooltipField: 'version',
    },
  ]

  return (
    <Box className="shadow-none">
      <Typography>Projects: {projectsData.count}</Typography>
      <Divider className="my-2 border-0" />
      <ViewTable<ApiApprovalSummary['projects']['data'][0]>
        columnDefs={[...columnDefs]}
        defaultColDef={{
          headerClass: 'ag-text-center',
          cellClass: 'ag-text-center ag-cell-ellipsed',
          minWidth: 90,
          resizable: true,
          sortable: true,
        }}
        resizeGridOnRowUpdate={true}
        domLayout="normal"
        enablePagination={false}
        alwaysShowHorizontalScroll={false}
        rowData={projectsData.data}
        rowBuffer={120}
        rowsVisible={90}
        tooltipShowDelay={200}
        context={{ disableValidation: true }}
        components={{
          agColumnHeader: undefined,
          agTextCellRenderer: undefined,
        }}
      />
    </Box>
  )
}

const ApprovalSummaryPreview = (props: { previewData: ApiApprovalSummary }) => {
  const { previewData } = props
  return <Box className="shadow-none">the preview comes here</Box>
}

const initialRequestParams = () => ({
  meeting_id: '',
  submission_status: '',
  blanket_consideration: false,
  individual_consideration: true,
})

const ApprovalSummaryFilters = (props: {
  requestParams: ReturnType<typeof initialRequestParams>
  setRequestParams: React.Dispatch<
    React.SetStateAction<ReturnType<typeof initialRequestParams>>
  >
  onFetchPreview: () => void
}) => {
  const { requestParams, setRequestParams, onFetchPreview } = props

  const meetings = useMeetingOptions()

  const submissionStatusOptions = [
    { name: 'Recommended', value: 'recommended' },
    { name: 'Approved', value: 'approved' },
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
          <Button size="large" variant="contained" onClick={onFetchPreview}>
            Preview summary
          </Button>
        </div>
      </div>
    </Box>
  )
}

const ApprovalSummary = () => {
  const [requestParams, setRequestParams] = useState(initialRequestParams)

  const approvalSummaryApi = useApi<ApiApprovalSummary>({
    path: 'api/projects-approval-summary',
    options: {
      triggerIf: false,
      params: requestParams,
      withStoreCache: false,
    },
  })

  const handleFetchPreview = () => {
    approvalSummaryApi.setParams(requestParams)
    approvalSummaryApi.setApiSettings((prevSettings) => ({
      ...prevSettings,
      options: { ...prevSettings.options, triggerIf: true },
    }))
  }

  const previewData =
    (approvalSummaryApi.loaded && approvalSummaryApi.data) || null

  return (
    <>
      <Box className="shadow-none">
        <ApprovalSummaryFilters
          requestParams={requestParams}
          setRequestParams={setRequestParams}
          onFetchPreview={handleFetchPreview}
        />
        <Divider className="my-2 border-0" />
        {previewData && <ApprovalSummaryPreview previewData={previewData} />}
        <Divider className="my-2 border-0" />
        {previewData && (
          <ApprovalSummaryPreviewTable projectsData={previewData.projects} />
        )}
      </Box>
    </>
  )
}

export default ApprovalSummary

import { Box, Button, Checkbox, Divider, Typography } from '@mui/material'
import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput.tsx'
import { useMeetingOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import Field from '@ors/components/manage/Form/Field.tsx'
import { IoChevronDown } from 'react-icons/io5'
import React, { ReactNode, useMemo, useState } from 'react'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import useApi from '@ors/hooks/useApi.ts'
import { ApiApprovalSummary } from '@ors/types/api_approval_summary.ts'
import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import { GridOptions, ICellRendererParams } from 'ag-grid-community'
import Link from '@ors/components/ui/Link/Link.tsx'
import { formatApiUrl } from '@ors/helpers'
import cx from 'classnames'

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
      headerName: 'Cluster',
      field: 'project_cluster',
      tooltipField: 'project_cluster',
    },
    {
      headerName: 'Type',
      field: 'type',
      tooltipField: 'type',
    },
    {
      headerName: 'Sector',
      field: 'project_sector',
      tooltipField: 'project_sector',
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

const ColsFundsRecommended = (props: {
  data: ApiApprovalSummary['bilateral_cooperation']['phase_out_plan']
  cellClass?: string
}) => {
  const { data, cellClass } = props
  return (
    <>
      <td className={cellClass}>
        {'$'}
        {data.project_funding}
      </td>
      <td className={cellClass}>
        {'$'}
        {data.project_support_cost}
      </td>
      <td className={cellClass}>
        {'$'}
        {data.total}
      </td>
    </>
  )
}

const TrAllCells = (props: {
  sector: ReactNode
  data: ApiApprovalSummary['bilateral_cooperation']['phase_out_plan']
  hasTopBorder?: boolean
}) => {
  const { data, sector, hasTopBorder } = props

  const cellClass = cx({
    'border border-x-0 border-b-0 border-solid border-primary': !!hasTopBorder,
  })

  return (
    <tr className="leading-7">
      <td className={cellClass}>{sector}</td>
      <td className={cellClass}>{data.hcfc}</td>
      <td className={cellClass}>{data.hfc}</td>
      <ColsFundsRecommended cellClass={cellClass} data={data} />
    </tr>
  )
}

const TrSection = (props: { title: ReactNode }) => {
  const { title } = props
  return (
    <tr className="leading-7">
      <td className="font-bold">{title}</td>
      <td colSpan={5}></td>
    </tr>
  )
}

const TrSpacing = () => (
  <tr>
    <td colSpan={6} className="h-5"></td>
  </tr>
)

const RowSectionBilateralCooperation = (props: {
  data: ApiApprovalSummary['bilateral_cooperation']
  title: string
}) => {
  const { title, data } = props
  return (
    <>
      <TrSection title={title} />
      <TrAllCells sector="Phase-out plan" data={data.phase_out_plan} />
      <TrAllCells sector="Destruction" data={data.destruction} />
      <TrAllCells sector="HFC phase-down" data={data.hfc_phase_down} />
      <TrAllCells sector="Energy efficiency" data={data.energy_efficiency} />
      <TrAllCells
        sector={<span className="font-bold">TOTAL:</span>}
        data={data.total}
      />
      <TrSpacing />
    </>
  )
}

const RowSectionInvestmentProject = (props: {
  data: ApiApprovalSummary['investment_project']
  title: ReactNode
}) => {
  const { title, data } = props
  return (
    <>
      <TrSection title={title} />
      <TrAllCells sector="Phase-out plan" data={data.phase_out_plan} />
      <TrAllCells sector="HFC phase-down" data={data.hfc_phase_down} />
      <TrAllCells sector="Energy efficiency" data={data.energy_efficiency} />
      <TrAllCells
        sector={<span className="font-bold">TOTAL:</span>}
        data={data.total}
      />
      <TrSpacing />
    </>
  )
}
const RowSectionWorkProgrammeAmendment = (props: {
  data: ApiApprovalSummary['work_programme_amendment']
  title: ReactNode
}) => {
  const { title, data } = props
  return (
    <>
      <TrSection title={title} />
      <TrAllCells sector="Phase-out plan" data={data.phase_out_plan} />
      <TrAllCells sector="Destruction" data={data.destruction} />
      <TrAllCells sector="Several" data={data.several} />
      <TrAllCells sector="HFC phase-down" data={data.hfc_phase_down} />
      <TrAllCells sector="Energy efficiency" data={data.energy_efficiency} />
      <TrAllCells
        sector={<span className="font-bold">TOTAL:</span>}
        data={data.total}
      />
      <TrSpacing />
    </>
  )
}

const ApprovalSummaryPreview = (props: { previewData: ApiApprovalSummary }) => {
  const { previewData } = props
  return (
    <Box className="flex justify-center shadow-none">
      <table className="border-collapse sm:w-full md:w-3/5">
        <thead>
          <tr>
            <th>Sector</th>
            <th>HCFC</th>
            <th>HFC</th>
            <th colSpan={3}>Funds reccommended (US $)</th>
          </tr>
          <tr>
            <th></th>
            <th>(ODP tonnes)</th>
            <th>(CO2-eq '000 tonnes)</th>
            <th>Project</th>
            <th>Support</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <RowSectionBilateralCooperation
            title="BILATERAL COOPERATION"
            data={previewData.bilateral_cooperation}
          />
          <RowSectionInvestmentProject
            title="INVESTMENT PROJECT"
            data={previewData.investment_project}
          />
          <RowSectionWorkProgrammeAmendment
            title="WORK PROGRAMME AMENDMENT"
            data={previewData.work_programme_amendment}
          />
          <tr>
            <td
              colSpan={6}
              className="border border-x-0 border-b border-solid border-primary text-center font-bold"
            >
              Summary by Parties and Implementing Agencies
            </td>
          </tr>
          <TrSpacing />
          {previewData.summary_by_parties_and_implementing_agencies.map(
            (a, idx) => {
              const addTopBorder =
                idx > 1 &&
                a.agency_type !==
                  previewData.summary_by_parties_and_implementing_agencies[
                    idx - 1
                  ].agency_type
              return (
                <TrAllCells
                  key={a.agency_name}
                  sector={a.agency_name}
                  hasTopBorder={addTopBorder}
                  data={a}
                />
              )
            },
          )}
          <TrAllCells
            sector={
              <span className="font-bold">GRAND TOTAL (HCFCs and HFCs):</span>
            }
            data={previewData.grand_total}
          />
        </tbody>
      </table>
    </Box>
  )
}

const initialRequestParams = () => ({
  meeting_id: '',
  submission_status: '',
  blanket_consideration: false,
  individual_consideration: true,
})

const ApprovalSummaryFilters = (props: {
  hasPreviewData: boolean
  requestParams: ReturnType<typeof initialRequestParams>
  setRequestParams: React.Dispatch<
    React.SetStateAction<ReturnType<typeof initialRequestParams>>
  >
  onFetchPreview: () => void
}) => {
  const { requestParams, hasPreviewData, setRequestParams, onFetchPreview } =
    props

  const meetings = useMeetingOptions()

  const submissionStatusOptions = [
    { name: 'Recommended', value: 'recommended' },
    { name: 'Approved', value: 'approved' },
  ]

  const downloadUrl = useMemo(() => {
    const encodedParams = new URLSearchParams(
      requestParams as unknown as Record<string, string>,
    ).toString()
    return formatApiUrl(`api/projects-approval-summary/export?${encodedParams}`)
  }, [requestParams])

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
          <div className="flex gap-4">
            <Button size="large" variant="contained" onClick={onFetchPreview}>
              Preview summary
            </Button>
            <Link
              button
              disabled={!hasPreviewData}
              size="large"
              href={downloadUrl}
              variant="contained"
            >
              Download summary
            </Link>
          </div>
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
          hasPreviewData={!!previewData}
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

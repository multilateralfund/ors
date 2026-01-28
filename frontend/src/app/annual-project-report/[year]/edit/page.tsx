import React, { useContext, useEffect, useRef, useState } from 'react'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import BackLink from '@ors/components/manage/Blocks/AnnualProgressReport/BackLink.tsx'
import { useLocation, useParams } from 'wouter'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import { Alert, Box, Tab, Tabs } from '@mui/material'
import useApi from '@ors/hooks/useApi.ts'
import NotFoundPage from '@ors/app/not-found.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import { useStore } from '@ors/store.tsx'
import cx from 'classnames'
import Loader from '@ors/components/manage/Blocks/AnnualProgressReport/Loader.tsx'
import useGetColumnDefs, {
  dataTypeDefinitions,
} from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'
import { AgGridReact } from 'ag-grid-react'
import Button from '@mui/material/Button'
import { api } from '@ors/helpers'
import { enqueueSnackbar } from 'notistack'
import EditTable from '@ors/components/manage/Form/EditTable.tsx'
import {
  IoAlertCircle,
  IoClipboardOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5'
import {
  AnnualAgencyProjectReport,
  AnnualProjectReport,
} from '@ors/app/annual-project-report/types.ts'
import { useConfirmation } from '@ors/contexts/ConfirmationContext.tsx'
import { validateRows } from '@ors/components/manage/Blocks/AnnualProgressReport/validation.tsx'
import ValidationErrors from '@ors/components/manage/Blocks/AnnualProgressReport/ValidationErrors.tsx'
import usePageTitle from '@ors/hooks/usePageTitle.ts'

const TABS = [
  {
    label: 'Date',
    fieldsGroup: 'Date data fields',
  },
  {
    label: 'Phaseout',
    fieldsGroup: 'Phaseout data fields',
  },
  {
    label: 'Financial',
    fieldsGroup: 'Financial data fields',
  },
  {
    label: 'Narrative and Indicators',
    fieldsGroup: 'Narrative & Indicators Data Fields',
  },
]

export default function APREdit() {
  const [, navigate] = useLocation()
  const confirm = useConfirmation()
  const gridRef = useRef<AgGridReact>()
  const { year } = useParams()
  usePageTitle(`Edit - Annual Progress Report (${year})`)
  const [activeTab, setActiveTab] = useState(0)
  const { canEditAPR, isMlfsUser } = useContext(PermissionsContext)
  const { data: user } = useStore((state) => state.user)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>[]
  >([])
  const hasValidationErrors = validationErrors.length > 0

  const getPath = isMlfsUser
    ? `api/annual-project-report/mlfs/${year}/agencies/`
    : `api/annual-project-report/${year}/workspace/`
  const {
    data: apr,
    loading,
    loaded,
    refetch,
  } = useApi<any>({
    options: {
      withStoreCache: false,
      triggerIf: canEditAPR,
    },
    path: getPath,
  })
  const [rows, setRows] = useState<AnnualProjectReport[]>([])

  // Copy the initial data in our state for modifying
  useEffect(() => {
    if (!apr) {
      return
    }

    const aprRows: AnnualProjectReport[] = isMlfsUser
      ? apr.flatMap((agencyData: AnnualAgencyProjectReport) =>
          structuredClone(agencyData.project_reports),
        )
      : apr.project_reports
    setRows(aprRows)
  }, [apr, isMlfsUser])

  const { columnDefs, defaultColDef } = useGetColumnDefs({
    year: year!,
    clipboardEdit: true,
    rows,
    setRows,
  })

  if (!canEditAPR) {
    return <NotFoundPage />
  }

  const canUpdateAPR = isMlfsUser
    ? apr &&
      !apr.some(
        (reportAgency: AnnualAgencyProjectReport) => reportAgency.is_endorsed,
      )
    : apr && (apr.status === 'draft' || apr.is_unlocked)

  const exportAll = async () => {
    setValidationErrors([])
    if (!gridRef.current) {
      return
    }

    const allData: AnnualProjectReport[] = []
    gridRef.current.api.forEachNode((node) => {
      allData.push(node.data)
    })

    const { formErrors, hasErrors } = validateRows(allData, columnDefs)
    if (hasErrors) {
      setValidationErrors(formErrors)
      enqueueSnackbar(<>Fix the validation errors before saving.</>, {
        variant: 'error',
      })
      return
    }

    try {
      const updatePath = isMlfsUser
        ? `api/annual-project-report/mlfs/${year}/bulk-update/`
        : `api/annual-project-report/${year}/agency/${user.agency_id}/update/`
      await api(updatePath, {
        data: {
          project_reports: allData,
        },
        method: 'POST',
      })

      refetch()
      enqueueSnackbar(<>Saved APR.</>, {
        variant: 'success',
      })
    } catch (e) {
      // TODO: better error reporting
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  const goBackToWorkspace = async () => {
    const response = await confirm({
      title: 'Navigate to workspace',
      message: `Are you sure you want to return to the Annual Progress Report workspace? Unsaved data will be lost!`,
    })

    if (!response) {
      return
    }

    const url = isMlfsUser ? `/${year}/mlfs/workspace` : `/${year}/workspace`
    navigate(url)
  }

  return (
    <PageWrapper>
      <BackLink
        url={`/${year}/workspace`}
        text="Annual Progress Report Workspace"
      />
      <PageHeading className="min-w-fit">
        <span className="font-normal">Update: </span>
        {`Annual Progress Report (${year})`}
      </PageHeading>
      <Box className="shadow-none">
        <div className="flex justify-between">
          <Tabs
            className="sectionsTabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{
              className: 'h-0',
              style: { transitionDuration: '150ms' },
            }}
            value={activeTab}
            onChange={(_, value) => {
              setActiveTab(value)
            }}
            aria-label="Anual Project Report form tabs"
          >
            {TABS.map((tab, index) => {
              const tabFields = columnDefs
                .filter((colDef) => colDef.group === tab.fieldsGroup)
                .map((colDef) => colDef.headerName)

              const tabHasErrors = validationErrors.some((rowErrors) =>
                tabFields.some((field) => rowErrors[field]),
              )

              return (
                <Tab
                  key={tab.fieldsGroup}
                  label={
                    <div className="flex gap-x-2">
                      <span>{tab.label}</span>
                      {tabHasErrors && (
                        <IoAlertCircle
                          className="rounded-full bg-[#002A3C]"
                          color="#EBFF00"
                          size={24}
                        />
                      )}
                    </div>
                  }
                  id={`tab-${index}`}
                  aria-controls={`tabpanel-${index}`}
                />
              )
            })}
          </Tabs>
          <div className="mb-2 flex gap-x-2">
            <Button
              variant="contained"
              color="secondary"
              onClick={goBackToWorkspace}
            >
              Cancel
            </Button>
            <Button
              disabled={loading || !canUpdateAPR}
              variant="contained"
              onClick={exportAll}
            >
              Save
            </Button>
          </div>
        </div>
        {TABS.map((tab, index) => (
          <div
            key={tab.fieldsGroup}
            className={cx({
              hidden: activeTab !== index,
            })}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            role="tabpanel"
          >
            <Loader active={loading} />
            {loaded && (
              <EditTable
                rowsVisible={100}
                Toolbar={() => (
                  <>
                    <Alert
                      className="flex-1 bg-mlfs-bannerColor"
                      icon={<IoInformationCircleOutline size={24} />}
                      severity="info"
                    >
                      <ul className="mt-0.5 list-inside space-y-1 pl-0">
                        <li>
                          Columns containing the{' '}
                          <span className="inline-flex align-middle">
                            <IoClipboardOutline />
                          </span>{' '}
                          icon allow pasting of values onto multiple rows when
                          these values have been copied from an Excel file
                          downloaded from this system. Follow these steps to do
                          this:
                          <ol className="mt-1 space-y-1 pl-4">
                            <li>
                              In the Excel file, select the desired cells from
                              the second column (Project Code), and while
                              holding down the CTRL key, continue selecting the
                              corresponding cells from the target column where
                              you intend to paste the data (e.g. First
                              Disbursement Date).
                            </li>
                            <li>
                              Return to this screen and click the{' '}
                              <span className="inline-flex align-middle">
                                <IoClipboardOutline />
                              </span>{' '}
                              icon from the desired header column (e.g. First
                              Disbursement Date). The system will paste the
                              values in the correct activities, regardless of
                              how the Excel rows were sorted.
                            </li>
                          </ol>
                        </li>
                      </ul>
                    </Alert>
                    {hasValidationErrors && (
                      <ValidationErrors validationErrors={validationErrors} />
                    )}
                    <div>Total rows: {rows.length ?? 0}</div>
                  </>
                )}
                gridRef={gridRef}
                dataTypeDefinitions={dataTypeDefinitions}
                columnDefs={columnDefs.filter(
                  (colDef) =>
                    colDef.field === 'project_code' ||
                    colDef.group === TABS[activeTab].fieldsGroup,
                )}
                defaultColDef={defaultColDef}
                rowData={rows}
                isDataFormatted={true}
                tooltipShowDelay={200}
                singleClickEdit={true}
                noRowsOverlayComponentParams={
                  isMlfsUser
                    ? {
                        label: 'No projects submitted by the IA/BAs yet',
                      }
                    : {
                        label: 'No projects to edit',
                      }
                }
              />
            )}
          </div>
        ))}
      </Box>
    </PageWrapper>
  )
}

import React, { useContext, useEffect, useRef, useState } from 'react'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import BackToWorkspace from '@ors/components/manage/Blocks/AnnualProgressReport/BackToWorkspace.tsx'
import { useParams } from 'wouter'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import { Alert, Box, Tab, Tabs } from '@mui/material'
import useApi from '@ors/hooks/useApi.ts'
import NotFoundPage from '@ors/app/not-found.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import { useStore } from '@ors/store.tsx'
import cx from 'classnames'
import Loader from '@ors/components/manage/Blocks/AnnualProgressReport/Loader.tsx'
import getColumnDefs, {
  dataTypeDefinitions,
} from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'
import { AgGridReact } from 'ag-grid-react'
import Button from '@mui/material/Button'
import { api } from '@ors/helpers'
import { enqueueSnackbar } from 'notistack'
import EditTable from '@ors/components/manage/Form/EditTable.tsx'
import { IoClipboardOutline, IoInformationCircleOutline } from 'react-icons/io5'
import {
  AnnualAgencyProjectReport,
  AnnualProjectReport,
} from '@ors/app/annual-project-report/types.ts'

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
  const gridRef = useRef<AgGridReact>()
  const { year } = useParams()
  const [activeTab, setActiveTab] = useState(0)
  const { canEditAPR } = useContext(PermissionsContext)
  const { data: user } = useStore((state) => state.user)
  const {
    data: apr,
    loading,
    loaded,
  } = useApi<AnnualAgencyProjectReport>({
    options: {
      withStoreCache: false,
    },
    path: `api/annual-project-report/${year}/workspace/`,
  })
  const [rows, setRows] = useState<AnnualProjectReport[]>([])

  // Copy the initial data in our state for modifying
  useEffect(() => {
    if (!apr) {
      return
    }

    setRows(apr.project_reports)
  }, [apr])

  const { columnDefs, defaultColDef } = getColumnDefs({
    group: TABS[activeTab].fieldsGroup,
    clipboardEdit: true,
    rows,
    setRows,
  })

  // TODO: change later for mlfs
  if (!canEditAPR || !user.agency_id) {
    return <NotFoundPage />
  }

  const isDraft = apr?.status === 'draft' || apr?.is_unlocked

  const exportAll = async () => {
    if (!gridRef.current) {
      return
    }

    const allData: AnnualProjectReport[] = []
    gridRef.current.api.forEachNode((node) => {
      allData.push(node.data)
    })

    try {
      await api(
        `api/annual-project-report/${year}/agency/${user.agency_id}/update/`,
        {
          data: {
            project_reports: allData,
          },
          method: 'POST',
        },
      )

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

  return (
    <PageWrapper>
      <BackToWorkspace year={year} />
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
              return (
                <Tab
                  key={tab.fieldsGroup}
                  label={tab.label}
                  id={`tab-${index}`}
                  aria-controls={`tabpanel-${index}`}
                />
              )
            })}
          </Tabs>
          <Button
            disabled={loading || !isDraft}
            className="mb-2"
            variant="contained"
            onClick={exportAll}
          >
            Save
          </Button>
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
                Toolbar={() => (
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
                            In the Excel file, select the desired cells from the
                            second column (Project Code), and while holding down
                            the CTRL key, continue selecting the corresponding
                            cells from the target column where you intend to
                            paste the data (e.g. First Disbursement Date).
                          </li>
                          <li>
                            Return to this screen and click the{' '}
                            <span className="inline-flex align-middle">
                              <IoClipboardOutline />
                            </span>{' '}
                            icon from the desired header column (e.g. First
                            Disbursement Date). The system will paste the values
                            in the correct activities, regardless of how the
                            Excel rows were sorted.
                          </li>
                        </ol>
                      </li>
                    </ul>
                  </Alert>
                )}
                gridRef={gridRef}
                dataTypeDefinitions={dataTypeDefinitions}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowData={rows}
                isDataFormatted={true}
                tooltipShowDelay={200}
                singleClickEdit={true}
                reactiveCustomComponents={true}
              />
            )}
          </div>
        ))}
      </Box>
    </PageWrapper>
  )
}

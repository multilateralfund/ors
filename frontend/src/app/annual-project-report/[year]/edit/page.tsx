import React, { useContext, useRef, useState } from 'react'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import BackToWorkspace from '@ors/components/manage/Blocks/AnnualProgressReport/BackToWorkspace.tsx'
import { useParams } from 'wouter'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import { Box, Tabs, Tab } from '@mui/material'
import useApi from '@ors/hooks/useApi.ts'
import NotFoundPage from '@ors/app/not-found.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import { useStore } from '@ors/store.tsx'
import cx from 'classnames'
import Loader from '@ors/components/manage/Blocks/AnnualProgressReport/Loader.tsx'
import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import getColumnDefs, {
  dataTypeDefinitions,
} from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'
import { AgGridReact } from 'ag-grid-react'
import Button from '@mui/material/Button'
import { api } from '@ors/helpers'
import { enqueueSnackbar } from 'notistack'

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
  const { canViewAPR } = useContext(PermissionsContext)
  const { data: user } = useStore((state) => state.user)
  const {
    data: apr,
    loading,
    loaded,
  } = useApi({
    options: {
      withStoreCache: false,
    },
    path: `api/annual-project-report/${year}/workspace/`,
  })

  // TODO: change later for mlfs
  if (!canViewAPR || !user.agency_id) {
    return <NotFoundPage />
  }

  const { columnDefs, defaultColDef } = getColumnDefs(
    TABS[activeTab].fieldsGroup,
    true,
  )

  const exportAll = async () => {
    if (!gridRef.current) {
      return
    }

    const allData: any[] = []
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

      enqueueSnackbar(<>Submitted APR.</>, {
        variant: 'success',
      })
    } catch (e) {
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
          <Button className="mb-2" variant="contained" onClick={exportAll}>
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
              <ViewTable
                gridRef={gridRef}
                dataTypeDefinitions={dataTypeDefinitions}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowData={apr.project_reports}
                tooltipShowDelay={200}
                singleClickEdit={true}
              />
            )}
          </div>
        ))}
      </Box>
    </PageWrapper>
  )
}

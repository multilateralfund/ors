import { useContext, useState, useMemo } from 'react'
import { useParams, Redirect } from 'wouter'
import {
  Box,
  Chip,
  Button,
  Alert,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { IoChevronDown, IoInformationCircleOutline } from 'react-icons/io5'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import NotFoundPage from '@ors/app/not-found'
import useApi from '@ors/hooks/useApi.ts'
import usePageTitle from '@ors/hooks/usePageTitle.ts'
import Field from '@ors/components/manage/Form/Field.tsx'
import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import Loader from '@ors/components/manage/Blocks/AnnualProgressReport/Loader.tsx'
import getColumnDefs, {
  dataTypeDefinitions,
  tableColumns,
} from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import {
  INITIAL_PARAMS_MLFS,
  MANDATORY_STATUSES,
} from '@ors/components/manage/Blocks/AnnualProgressReport/constants.ts'
import { union } from 'lodash'
import { useStore } from '@ors/store.tsx'
import Tab from '@mui/material/Tab/Tab'
import cx from 'classnames'
import {
  AnnualAgencyProjectReport,
  Filter,
} from '@ors/app/annual-project-report/types.ts'

export default function APRMLFSWorkspace() {
  const [activeTab, setActiveTab] = useState(0)
  const { year } = useParams()
  usePageTitle(`MLFS Annual Progress Report (${year})`)
  const { canViewAPR, isMlfsUser } = useContext(PermissionsContext)
  const {
    statuses: { data: projectStatuses },
  } = useStore((state) => state.projects)

  const [filters, setFilters] =
    useState<Record<string, Filter[]>>(INITIAL_PARAMS_MLFS)

  const {
    data: aprData,
    loading,
    loaded,
    setParams,
  } = useApi<AnnualAgencyProjectReport[]>({
    options: {
      withStoreCache: false,
      triggerIf: canViewAPR && isMlfsUser,
    },
    path: `api/annual-project-report/mlfs/${year}/agencies/`,
  })

  // Flatten project reports from all agencies and add agency info
  const allProjectReports = useMemo(() => {
    if (!aprData || !Array.isArray(aprData)) return []

    return aprData.flatMap((agencyData) =>
      structuredClone(agencyData.project_reports),
    )
  }, [aprData])

  // Extract unique filter options
  const agencies = useMemo((): Filter[] => {
    if (!aprData || !Array.isArray(aprData)) return []
    return aprData
      .filter(
        (agencyData) =>
          Array.isArray(agencyData.project_reports) &&
          agencyData.project_reports.length > 0,
      )
      .map((agencyData) => ({
        id: agencyData.agency.id,
        name: agencyData.agency.name,
      }))
  }, [aprData])

  const regions = useMemo(() => {
    const uniqueRegions = new Set<string>()
    allProjectReports.forEach((report) => {
      if (report.region_name) {
        uniqueRegions.add(report.region_name)
      }
    })
    return Array.from(uniqueRegions).map((region) => ({
      id: region,
      name: region,
    }))
  }, [allProjectReports])

  const countries = useMemo(() => {
    const uniqueCountries = new Set<string>()
    allProjectReports.forEach((report) => {
      if (report.country_name) {
        uniqueCountries.add(report.country_name)
      }
    })
    return Array.from(uniqueCountries).map((country) => ({
      id: country,
      name: country,
    }))
  }, [allProjectReports])

  const clusters = useMemo(() => {
    const uniqueClusters = new Set<string>()
    allProjectReports.forEach((report) => {
      if (report.cluster_name) {
        uniqueClusters.add(report.cluster_name)
      }
    })
    return Array.from(uniqueClusters).map((cluster) => ({
      id: cluster,
      name: cluster,
    }))
  }, [allProjectReports])

  const choosableStatuses = useMemo(() => {
    return projectStatuses.filter(
      (status) => !MANDATORY_STATUSES.includes(status.code),
    )
  }, [projectStatuses])

  const onChipDelete =
    (filterKey: string, clearedObj: Filter, paramKey: keyof Filter = 'id') =>
    () => {
      const newFilters =
        filters[filterKey]?.filter((f) => f.id !== clearedObj.id) ?? []

      setFilters((oldFilters) => ({
        ...oldFilters,
        [filterKey]: newFilters,
      }))

      // Update the API params
      setParams({
        [filterKey]: newFilters.map((f) => f[paramKey]).join(','),
      })
    }

  const { columnDefs: columnDefs, defaultColDef } = getColumnDefs()

  // Redirect non-MLFS users to the agency workspace
  if (!isMlfsUser && canViewAPR) {
    return <Redirect to={`/${year}/workspace`} replace />
  }

  if (!canViewAPR) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <PageHeading className="min-w-fit">
        {`MLFS Annual Project Report Workspace (${year})`}
      </PageHeading>

      <Box className="shadow-none">
        <Loader active={loading} />
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
            <Tab
              label="Projects"
              id="tab-projects"
              aria-controls="tabpanel-projects"
            ></Tab>
            <Tab
              label="IA/BA Submissions"
              id="tab-submissions"
              aria-controls="tabpanel-submissions"
            ></Tab>
          </Tabs>
          <Button disabled className="mb-2" variant="contained">
            Endorse
          </Button>
        </div>

        <div
          className={cx({ hidden: activeTab !== 0 })}
          id="tabpanel-projects"
          aria-labelledby="tab-projects"
          role="tabpanel"
        >
          <Alert
            className="mb-4 bg-mlfs-bannerColor"
            icon={<IoInformationCircleOutline size={24} />}
            severity="info"
          >
            Viewing project reports for all agencies. Use filters for viewing
            less reports.
          </Alert>

          {/* Filters section */}
          <div className="mb-2 flex flex-col gap-y-4">
            <div className="flex flex-wrap gap-2">
              {/* Status filter */}
              <Field
                Input={{ placeholder: tableColumns.status.label }}
                options={getFilterOptions(filters, choosableStatuses, 'status')}
                widget="autocomplete"
                multiple={true}
                value={[]}
                getOptionLabel={(option: any) => option?.name}
                popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
                FieldProps={{ className: 'mb-0 md:w-32 BPList' }}
                componentsProps={{
                  popupIndicator: {
                    sx: {
                      transform: 'none !important',
                    },
                  },
                }}
                onChange={(_: any, value: any) => {
                  const statusFilters = union(filters.status, value)
                  setFilters((oldFilters) => ({
                    ...oldFilters,
                    status: statusFilters,
                  }))
                  setParams({
                    status: statusFilters.map((v: any) => v.code).join(','),
                  })
                }}
              />

              {/* Agency filter */}
              <Field
                Input={{ placeholder: 'Agency' }}
                options={getFilterOptions(filters, agencies, 'agency')}
                widget="autocomplete"
                multiple={true}
                value={[]}
                getOptionLabel={(option: any) => option?.name}
                popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
                FieldProps={{ className: 'mb-0 md:w-48 BPList' }}
                componentsProps={{
                  popupIndicator: {
                    sx: {
                      transform: 'none !important',
                    },
                  },
                }}
                onChange={(_: any, value: any) => {
                  const agencyFilters = union(filters.agency, value)
                  setFilters((oldFilters) => ({
                    ...oldFilters,
                    agency: agencyFilters,
                  }))
                  setParams({
                    agency: agencyFilters.map((v: any) => v.id).join(','),
                  })
                }}
              />

              {/* Region filter */}
              <Field
                Input={{ placeholder: 'Region' }}
                options={getFilterOptions(filters, regions, 'region')}
                widget="autocomplete"
                multiple={true}
                value={[]}
                getOptionLabel={(option: any) => option?.name}
                popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
                FieldProps={{ className: 'mb-0 md:w-48 BPList' }}
                componentsProps={{
                  popupIndicator: {
                    sx: {
                      transform: 'none !important',
                    },
                  },
                }}
                onChange={(_: any, value: any) => {
                  const regionFilters = union(filters.region, value)
                  setFilters((oldFilters) => ({
                    ...oldFilters,
                    region: regionFilters,
                  }))
                  setParams({
                    region: regionFilters.map((v: any) => v.id).join(','),
                  })
                }}
              />

              {/* Country filter */}
              <Field
                Input={{ placeholder: 'Country' }}
                options={getFilterOptions(filters, countries, 'country')}
                widget="autocomplete"
                multiple={true}
                value={[]}
                getOptionLabel={(option: any) => option?.name}
                popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
                FieldProps={{ className: 'mb-0 md:w-48 BPList' }}
                componentsProps={{
                  popupIndicator: {
                    sx: {
                      transform: 'none !important',
                    },
                  },
                }}
                onChange={(_: any, value: any) => {
                  const countryFilters = union(filters.country, value)
                  setFilters((oldFilters) => ({
                    ...oldFilters,
                    country: countryFilters,
                  }))
                  setParams({
                    country: countryFilters.map((v: any) => v.id).join(','),
                  })
                }}
              />

              {/* Cluster filter */}
              <Field
                Input={{ placeholder: 'Cluster' }}
                options={getFilterOptions(filters, clusters, 'cluster')}
                widget="autocomplete"
                multiple={true}
                value={[]}
                getOptionLabel={(option: any) => option?.name}
                popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
                FieldProps={{ className: 'mb-0 md:w-48 BPList' }}
                componentsProps={{
                  popupIndicator: {
                    sx: {
                      transform: 'none !important',
                    },
                  },
                }}
                onChange={(_: any, value: any) => {
                  const clusterFilters = union(filters.cluster, value)
                  setFilters((oldFilters) => ({
                    ...oldFilters,
                    cluster: clusterFilters,
                  }))
                  setParams({
                    cluster: clusterFilters.map((v: any) => v.id).join(','),
                  })
                }}
              />
            </div>

            {/* Also display the active filters */}
            <ul className="m-0 flex list-none flex-wrap gap-2 px-0">
              {Object.entries(filters).flatMap(([filterKey, filterValue]) => {
                const paramKey: keyof Filter =
                  filterKey === 'status' ? 'code' : 'id'
                return filterValue.map((val) => (
                  <li key={`${filterKey}-${val.id}`}>
                    <Chip
                      label={val.name}
                      onDelete={onChipDelete(filterKey, val, paramKey)}
                    />
                  </li>
                ))
              })}
              {Object.values(filters).some(
                (filterArr) => filterArr.length > 0,
              ) && (
                <li>
                  <Button
                    variant="text"
                    onClick={() => {
                      setFilters(INITIAL_PARAMS_MLFS)
                      setParams(INITIAL_PARAMS_MLFS)
                    }}
                  >
                    Clear all
                  </Button>
                </li>
              )}
            </ul>
          </div>

          {loaded && (
            <ViewTable
              dataTypeDefinitions={dataTypeDefinitions}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowData={allProjectReports}
              tooltipShowDelay={200}
            />
          )}
        </div>

        <div
          className={cx({ hidden: activeTab !== 1 })}
          id="tabpanel-submissions"
          aria-labelledby="tab-submissions"
          role="tabpanel"
        >
          {loaded && (
            <ul className="m-0 flex flex-col gap-y-4 p-0">
              {(aprData ?? []).map((agencyData) => {
                return (
                  <li className="m-0 list-none" key={agencyData.id}>
                    <Accordion>
                      <AccordionSummary>
                        {agencyData.agency.name}
                      </AccordionSummary>
                      <AccordionDetails>Details</AccordionDetails>
                    </Accordion>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Box>
    </PageWrapper>
  )
}

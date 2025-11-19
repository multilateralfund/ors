import { useContext, useState, useMemo } from 'react'
import { useParams, Redirect } from 'wouter'
import { Box, Chip, Button, Alert } from '@mui/material'
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
import { formatUSD } from '@ors/components/manage/Blocks/AnnualProgressReport/utils.ts'
import { union } from 'lodash'
import { useStore } from '@ors/store.tsx'

interface Filter {
  id: string | number
  name: string
  code?: string
}

interface ProjectReport {
  agency_name: string
  country_name: string
  region_name: string
  cluster_name: string | null
  status: string
  approved_funding: number | null
  funds_disbursed: number | null
  agency_status: string
  agency_is_unlocked: boolean
  [key: string]: any
}

export default function APRMLFSWorkspace() {
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
  } = useApi({
    options: {
      withStoreCache: false,
      triggerIf: canViewAPR && isMlfsUser,
    },
    path: `api/annual-project-report/mlfs/${year}/agencies/`,
  })

  // Flatten project reports from all agencies and add agency info
  const allProjectReports = useMemo((): ProjectReport[] => {
    if (!aprData || !Array.isArray(aprData)) return []

    return aprData.flatMap((agencyData: any) =>
      agencyData.project_reports.map((report: any) => ({
        ...report,
        agency_status: agencyData.status,
        agency_is_unlocked: agencyData.is_unlocked,
      }))
    )
  }, [aprData])

  // Extract unique filter options
  const agencies = useMemo((): Filter[] => {
    if (!aprData || !Array.isArray(aprData)) return []
    return aprData.map((agencyData: any) => ({
      id: agencyData.agency.id,
      name: agencyData.agency.name,
    }))
  }, [aprData])

  const regions = useMemo((): Filter[] => {
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

  const countries = useMemo((): Filter[] => {
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

  const clusters = useMemo((): Filter[] => {
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

  const { columnDefs: baseColumnDefs, defaultColDef } = getColumnDefs()
  const columnDefs = useMemo(() => {
    return [
      {
        headerName: 'Agency',
        field: 'agency_name',
        sortable: true,
        filter: true,
        pinned: 'left' as const,
        width: 150,
      },
      ...baseColumnDefs,
    ] as any
  }, [baseColumnDefs])

  // Redirect non-MLFS users to the agency workspace
  if (!isMlfsUser && canViewAPR) {
    return <Redirect to={`/apr/${year}/workspace`} replace />
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
        <Alert
          className="mb-4 bg-mlfs-bannerColor"
          icon={<IoInformationCircleOutline size={24} />}
          severity="info"
        >
          Viewing project reports for all agencies. Use filters for viewing less reports.
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
            {Object.values(filters).some((filterArr) => filterArr.length > 0) && (
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

          {/* Summary stats */}
          <div className="flex gap-4">
            <div className="rounded border p-3">
              <div className="text-sm text-gray-600">Total Projects</div>
              <div className="text-2xl font-semibold">
                {allProjectReports.length}
              </div>
            </div>
            <div className="rounded border p-3">
              <div className="text-sm text-gray-600">Total Approved Funding</div>
              <div className="text-2xl font-semibold">
                {formatUSD(
                  allProjectReports.reduce(
                    (sum, r) => sum + (r.approved_funding || 0), 0
                  )
                )}
              </div>
            </div>
            <div className="rounded border p-3">
              <div className="text-sm text-gray-600">Total Funds Disbursed</div>
              <div className="text-2xl font-semibold">
                {formatUSD(
                  allProjectReports.reduce(
                    (sum, r) => sum + (r.funds_disbursed || 0), 0
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <Loader active={loading} />
        {loaded && (
          <ViewTable
            dataTypeDefinitions={dataTypeDefinitions}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowData={allProjectReports}
            tooltipShowDelay={200}
          />
        )}
      </Box>

    </PageWrapper>
  )
}
import { Redirect, useParams, useSearch } from 'wouter'
import usePageTitle from '@ors/hooks/usePageTitle.ts'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import NotFoundPage from '@ors/app/not-found'
import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material'
import { FiDownload, FiEdit, FiTable } from 'react-icons/fi'
import { IoChevronDown, IoClose, IoSearchOutline } from 'react-icons/io5'
import { formatApiUrl } from '@ors/helpers'
import { AgGridReact } from 'ag-grid-react'
import { useStore } from '@ors/store.tsx'
import useGetColumnDefs, {
  checkboxColumnDef,
  dataTypeDefinitions,
} from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'
import UploadDocumentsModal from '@ors/components/manage/Blocks/AnnualProgressReport/UploadDocumentsModal.tsx'
import useApi from '@ors/hooks/useApi.ts'
import { union } from 'lodash'
import {
  INITIAL_PARAMS,
  MANDATORY_STATUSES,
} from '@ors/components/manage/Blocks/AnnualProgressReport/constants.ts'
import Loader from '@ors/components/manage/Blocks/AnnualProgressReport/Loader.tsx'
import Link from '@ors/components/ui/Link/Link.tsx'
import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import SubmitButton from '@ors/components/manage/Blocks/AnnualProgressReport/SubmitButton.tsx'
import {
  AnnualAgencyProjectReport,
  Filter,
} from '@ors/app/annual-project-report/types.ts'
import StatusFilter from '@ors/components/manage/Blocks/AnnualProgressReport/StatusFilter.tsx'
import BackLink from '@ors/components/manage/Blocks/AnnualProgressReport/BackLink.tsx'
import AprYearDropdown from '@ors/components/manage/Blocks/AnnualProgressReport/AprYearDropdown.tsx'
import Field from '@ors/components/manage/Form/Field.tsx'
import { handleExport } from '@ors/components/manage/Blocks/AnnualProgressReport/utils'
import { getFilterOptions } from '@ors/components/manage/Utils/utilFunctions.ts'
import { useAPRProjectStatuses } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'

export default function APRWorkspace() {
  const [loadingExport, setLoadingExport] = useState(false)
  const [loadingSummaryTables, setLoadingSummaryTables] = useState(false)
  const [isUploadDocumentsModalOpen, setIsUploadDocumentsModalOpen] =
    useState(false)
  const [projectCodeSearch, setProjectCodeSearch] = useState('')
  const [selectedProjectCodes, setSelectedProjectCodes] = useState<string[]>([])
  const gridRef = useRef<AgGridReact>()
  const { year } = useParams()
  usePageTitle(`Annual Progress Report (${year})`)
  const { canViewAPR, canSubmitAPR, canEditAPR, isMlfsUser } =
    useContext(PermissionsContext)
  const { data: user } = useStore((state) => state.user)
  const projectStatuses = useAPRProjectStatuses()
  const search = useSearch()
  const [initialSearch] = useState(search)
  const [filters, setFilters] = useState<Record<string, Filter[]>>(() => {
    const sp = new URLSearchParams(initialSearch)
    const restored: Record<string, Filter[]> = { ...INITIAL_PARAMS }
    const statusParam = sp.get('status')
    if (statusParam) {
      restored.status = statusParam
        .split(',')
        .filter(Boolean)
        .flatMap((code) => {
          const found = projectStatuses.find((s: any) => s.code === code)
          return found ? [found] : []
        })
    }
    for (const key of ['region', 'country', 'cluster']) {
      const val = sp.get(key)
      if (val) {
        restored[key] = val
          .split(',')
          .filter(Boolean)
          .map((v) => ({ id: v as unknown as number, name: v }))
      }
    }
    return restored
  })
  const [showDerivedColumns, setShowDerivedColumns] = useState(true)
  const {
    data: apr,
    loading,
    loaded,
    params,
    setParams,
    refetch,
  } = useApi<AnnualAgencyProjectReport>({
    options: {
      withStoreCache: false,
      triggerIf: canViewAPR,
      params: Object.fromEntries(
        [...new URLSearchParams(initialSearch)].filter(([, v]) => v),
      ),
    },
    path: `api/annual-project-report/${year}/workspace/`,
    reactivePath: true,
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (projectCodeSearch.length >= 3) {
        setParams({ search: projectCodeSearch })
      } else if (projectCodeSearch === '') {
        setParams({ search: '' })
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectCodeSearch])

  const { columnDefs, defaultColDef } = useGetColumnDefs({
    year: year!,
    showDerivedColumns,
  })

  const regions = useMemo(() => {
    const uniqueRegions = new Set<string>()
    apr?.project_reports?.forEach((report) => {
      if (report.region_name) uniqueRegions.add(report.region_name)
    })
    return Array.from(uniqueRegions).map((r) => ({ id: r, name: r }))
  }, [apr?.project_reports])

  const countries = useMemo(() => {
    const uniqueCountries = new Set<string>()
    apr?.project_reports?.forEach((report) => {
      if (report.country_name) uniqueCountries.add(report.country_name)
    })
    return Array.from(uniqueCountries).map((c) => ({ id: c, name: c }))
  }, [apr?.project_reports])

  const clusters = useMemo(() => {
    const uniqueClusters = new Set<string>()
    apr?.project_reports?.forEach((report) => {
      if (report.cluster_name) uniqueClusters.add(report.cluster_name)
    })
    return Array.from(uniqueClusters).map((c) => ({ id: c, name: c }))
  }, [apr?.project_reports])

  const choosableStatuses = useMemo(
    () => projectStatuses.filter((s) => !MANDATORY_STATUSES.includes(s.code)),
    [projectStatuses],
  )

  if (!canViewAPR) {
    return <NotFoundPage />
  }
  if (isMlfsUser) {
    return <Redirect to={`/${year}/mlfs/workspace`} replace />
  }

  const onChipDelete =
    (filterKey: string, clearedObj: Filter, paramKey: keyof Filter = 'id') =>
    () => {
      const newFilters =
        filters[filterKey]?.filter((f) => f.id !== clearedObj.id) ?? []

      setFilters((oldFilters) => ({
        ...oldFilters,
        [filterKey]: newFilters,
      }))
      setParams({
        [filterKey]: newFilters.map((f) => f[paramKey]).join(','),
      })
    }

  const isDraft = apr?.status === 'draft' || apr?.is_unlocked
  const canUpdateAPR = canEditAPR && isDraft

  const editHref = (() => {
    const sp = new URLSearchParams()
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        sp.set(
          key,
          values
            .map((f) => (key === 'status' ? f.code! : String(f.id)))
            .join(','),
        )
      }
    })
    const q = sp.toString()
    return `/${year}/edit${q ? `?${q}` : ''}`
  })()

  return (
    <PageWrapper>
      {/* "~" means absolute, outside the nested context */}
      <BackLink url="~/projects-listing" text="IA/BA Portal" />
      <div className="mb-2 flex justify-between">
        <PageHeading className="flex min-w-fit items-center gap-x-2">
          {`Annual Progress Report workspace`}
          <AprYearDropdown />
          <span className="rounded border border-solid px-1 text-lg">
            {isDraft ? 'DRAFT' : 'SUBMITTED'}
          </span>
          {apr?.is_endorsed && (
            <span className="rounded border border-solid px-1 text-lg">
              ENDORSED
            </span>
          )}
        </PageHeading>
        <div className="flex gap-x-2">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setIsUploadDocumentsModalOpen(true)}
          >
            Documents for this APR
          </Button>
          {canSubmitAPR && user.agency_id && (
            <SubmitButton
              disabled={!isDraft || loading}
              revalidateData={refetch}
              year={year}
              agencyId={user.agency_id}
            />
          )}
        </div>
      </div>
      <Box className="shadow-none">
        <Loader active={loading} />
        <div className="mb-2 flex items-start justify-between">
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="BPList">
                <TextField
                  size="small"
                  placeholder="Search by project code..."
                  value={projectCodeSearch}
                  onChange={(e) => setProjectCodeSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoSearchOutline size={18} />
                      </InputAdornment>
                    ),
                    endAdornment: projectCodeSearch ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setProjectCodeSearch('')
                            setParams({ search: '' })
                          }}
                        >
                            <IoClose size={16} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </div>

              {/* Region filter */}
              <Field
                Input={{ placeholder: 'Region' }}
                options={getFilterOptions(filters, regions, 'region')}
                widget="autocomplete"
                multiple={true}
                value={[]}
                getOptionLabel={(option: any) => option?.name}
                popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
                FieldProps={{ className: 'mb-0 md:w-24 BPList' }}
                componentsProps={{
                  popupIndicator: { sx: { transform: 'none !important' } },
                  paper: { sx: { minWidth: 'max-content' } },
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
                FieldProps={{ className: 'mb-0 md:w-24 BPList' }}
                componentsProps={{
                  popupIndicator: { sx: { transform: 'none !important' } },
                  paper: { sx: { minWidth: 'max-content' } },
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
                FieldProps={{ className: 'mb-0 md:w-24 BPList' }}
                componentsProps={{
                  popupIndicator: { sx: { transform: 'none !important' } },
                  paper: { sx: { minWidth: 'max-content' } },
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

              <StatusFilter
                disabled={loading}
                statusOptions={choosableStatuses}
                selectedCodes={filters.status.map((f) => f.code!)}
                onToggle={(status, checked) => {
                  const statusFilters = checked
                    ? union(filters.status, [status])
                    : filters.status.filter((f) => f.code !== status.code)

                  setFilters((oldFilters) => ({
                    ...oldFilters,
                    status: statusFilters,
                  }))
                  setParams({
                    status: statusFilters.map((f) => f.code).join(','),
                  })
                }}
              />
            </div>

            {(Object.values(filters).some(
              (filterArr) => filterArr.length > 0,
            ) || !!projectCodeSearch) && (
              <ul className="m-0 flex list-none gap-x-2 px-0 py-2">
                {projectCodeSearch && (
                  <li key="search">
                    <Chip
                      label={projectCodeSearch}
                      onDelete={() => {
                        setProjectCodeSearch('')
                        setParams({ search: '' })
                      }}
                    />
                  </li>
                )}
                {Object.entries(filters).flatMap(([filterKey, filterValue]) => {
                  const paramKey: keyof Filter =
                    filterKey === 'status' ? 'code' : 'id'
                  return filterValue.map((val) => (
                    <li key={`${filterKey}-${val.id}`}>
                      <Chip
                        label={filterKey === 'status' ? val.code : val.name}
                        onDelete={onChipDelete(filterKey, val, paramKey)}
                      />
                    </li>
                  ))
                })}
                <li>
                  <Button
                    variant="text"
                    onClick={() => {
                      setFilters(INITIAL_PARAMS)
                      setParams({ ...INITIAL_PARAMS, search: '' })
                      setProjectCodeSearch('')
                      setSelectedProjectCodes([])
                      gridRef.current?.api?.deselectAll()
                    }}
                  >
                    Clear all
                  </Button>
                </li>
              </ul>
            )}
          </div>

          <div className="flex flex-col items-end">
            <div className="flex gap-x-2 whitespace-nowrap">
              <Button
                variant="text"
                startIcon={<FiDownload size={18} />}
                onClick={() =>
                  handleExport(
                    formatApiUrl(
                      `api/annual-project-report/${year}/agency/${user.agency_id}/export/`,
                      selectedProjectCodes.length > 0
                        ? {
                            ...params,
                            project_codes: selectedProjectCodes.join(','),
                          }
                        : params,
                    ),
                    setLoadingExport,
                  )
                }
                disabled={loadingExport}
                endIcon={loadingExport && <CircularProgress size={16} />}
              >
                Export APR
              </Button>
              <Link
                button
                variant="text"
                startIcon={<FiEdit size={18} />}
                href={editHref}
                disabled={!canUpdateAPR}
              >
                Update APR
              </Link>
              <Button
                variant="text"
                startIcon={<FiTable size={18} />}
                onClick={() =>
                  handleExport(
                    formatApiUrl(
                      `api/annual-project-report/summary-tables/export/`,
                    ),
                    setLoadingSummaryTables,
                  )
                }
                disabled={loadingSummaryTables}
                endIcon={loadingSummaryTables && <CircularProgress size={16} />}
              >
                Generate summary tables
              </Button>
            </div>

            {(loadingExport || loadingSummaryTables) && (
              <div className="ml-1.5 mt-1 max-h-10 text-sm text-gray-500 opacity-100">
                Download may take more than 1 minute, please wait!
              </div>
            )}
            <FormControlLabel
              label="Show derived columns"
              control={
                <Checkbox
                  checked={showDerivedColumns}
                  onChange={(e) => setShowDerivedColumns(e.target.checked)}
                />
              }
            />
          </div>
        </div>
        {loaded && (
          <ViewTable
            noRowsOverlayComponentParams={{
              label: 'No reported projects',
            }}
            Toolbar={() => {
              return (
                <div className="flex gap-x-4">
                  <div>Total rows: {apr?.project_reports.length ?? 0}</div>
                  {selectedProjectCodes.length > 0 && (
                    <div>{selectedProjectCodes.length} selected</div>
                  )}
                </div>
              )
            }}
            rowsVisible={100}
            gridRef={gridRef}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            isRowSelectable={(node) => {
              const statusName = node.data?.status
              const status = projectStatuses.find(
                (s: any) => s.name === statusName,
              )
              return !MANDATORY_STATUSES.includes(status?.code ?? '')
            }}
            dataTypeDefinitions={dataTypeDefinitions}
            columnDefs={[checkboxColumnDef, ...columnDefs]}
            defaultColDef={defaultColDef}
            rowData={apr?.project_reports ?? []}
            tooltipShowDelay={200}
            onSelectionChanged={() => {
              const nodes = gridRef.current?.api?.getSelectedNodes() ?? []
              setSelectedProjectCodes(
                nodes
                  .map((n) => n.data?.project_code)
                  .filter(Boolean) as string[],
              )
            }}
          />
        )}
      </Box>
      {isUploadDocumentsModalOpen && user.agency_id && (
        <UploadDocumentsModal
          isModalOpen={isUploadDocumentsModalOpen}
          setIsModalOpen={setIsUploadDocumentsModalOpen}
          year={year}
          agencyId={user.agency_id}
          oldFiles={apr?.files ?? []}
          revalidateFiles={refetch}
          disabled={!canUpdateAPR || loading}
        />
      )}
    </PageWrapper>
  )
}

import React, { useContext, useMemo, useRef, useState } from 'react'
import { Redirect, useLocation, useParams } from 'wouter'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Tabs,
} from '@mui/material'
import { IoChevronDown, IoInformationCircleOutline } from 'react-icons/io5'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import NotFoundPage from '@ors/app/not-found'
import useApi from '@ors/hooks/useApi.ts'
import usePageTitle from '@ors/hooks/usePageTitle.ts'
import Field from '@ors/components/manage/Form/Field.tsx'
import Loader from '@ors/components/manage/Blocks/AnnualProgressReport/Loader.tsx'
import useGetColumnDefs, {
  dataTypeDefinitions,
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
  AnnualProgressReport,
  AnnualProgressReportKickstart,
  AnnualProjectReport,
  APRFile,
  Filter,
} from '@ors/app/annual-project-report/types.ts'
import { MdExpandMore } from 'react-icons/md'
import {
  FiDownload,
  FiEdit,
  FiFile,
  FiLock,
  FiTable,
  FiUnlock,
} from 'react-icons/fi'
import { formatDate } from '@ors/components/manage/Blocks/AnnualProgressReport/utils.ts'
import {
  useAPRCurrentYear,
  useConfirmation,
} from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import { enqueueSnackbar } from 'notistack'
import { api, formatApiUrl } from '@ors/helpers'
import EndorseAprModal from '@ors/app/annual-project-report/[year]/mlfs/workspace/EndorseAPRModal.tsx'
import StatusFilter from '@ors/components/manage/Blocks/AnnualProgressReport/StatusFilter.tsx'
import MlfsLink from '@ors/components/ui/Link/Link.tsx'
import EditTable from '@ors/components/manage/Form/EditTable.tsx'
import { AgGridReact } from 'ag-grid-react'
import BackLink from '@ors/components/manage/Blocks/AnnualProgressReport/BackLink.tsx'
import AprYearDropdown from '@ors/components/manage/Blocks/AnnualProgressReport/AprYearDropdown.tsx'
import { validateRows } from '@ors/components/manage/Blocks/AnnualProgressReport/validation.tsx'
import ValidationErrors from '@ors/components/manage/Blocks/AnnualProgressReport/ValidationErrors.tsx'

export default function APRMLFSWorkspace() {
  const [, navigate] = useLocation()
  const gridRef = useRef<AgGridReact>()
  const [activeTab, setActiveTab] = useState(0)
  const [isEndorseModalOpen, setIsEndorseModalOpen] = useState(false)
  const confirm = useConfirmation()
  const { year } = useParams()
  usePageTitle(`Secretariat - Annual Progress Report (${year})`)
  const { canViewAPR, isMlfsUser, canEditAPR } = useContext(PermissionsContext)
  const {
    statuses: { data: projectStatuses },
  } = useStore((state) => state.projects)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>[]
  >([])
  const hasValidationErrors = validationErrors.length > 0

  const [filters, setFilters] =
    useState<Record<string, Filter[]>>(INITIAL_PARAMS_MLFS)

  const { refetch: refetchAPRCurrentYear } = useAPRCurrentYear()
  const {
    data: aprData,
    loading: loadingAprData,
    loaded: loadedAprData,
    params,
    setParams,
    refetch: refetchAprData,
  } = useApi<AnnualAgencyProjectReport[]>({
    options: {
      withStoreCache: false,
      triggerIf: canViewAPR && isMlfsUser,
    },
    path: `api/annual-project-report/mlfs/${year}/agencies/`,
    reactivePath: true,
  })
  const {
    data: progressReport,
    loading: loadingReport,
    loaded: loadedReport,
    refetch: refetchReport,
  } = useApi<AnnualProgressReport>({
    options: {
      withStoreCache: false,
      triggerIf: canViewAPR && isMlfsUser,
    },
    path: `api/annual-project-report/${year}/endorse/`,
    reactivePath: true,
  })
  const {
    data: kickstartAPR,
    loading: loadingKickstart,
    loaded: loadedKickstart,
    refetch: refetchKickstart,
  } = useApi<AnnualProgressReportKickstart>({
    options: {
      withStoreCache: false,
      triggerIf: canEditAPR && isMlfsUser,
    },
    path: `api/annual-project-report/kick-start/`,
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

  const canEndorseAPR = canEditAPR && progressReport?.is_endorsable
  const canUpdateAPR = Boolean(
    canEditAPR &&
      allProjectReports.length > 0 &&
      progressReport &&
      !progressReport.endorsed,
  )
  const canKickstartAPR = Boolean(
    canEditAPR && kickstartAPR && kickstartAPR.can_kick_start,
  )
  const { columnDefs: columnDefs, defaultColDef } = useGetColumnDefs({
    year: year!,
    inlineEdit: isMlfsUser && canUpdateAPR,
  })

  // Redirect non-MLFS users to the agency workspace
  if (!isMlfsUser && canViewAPR) {
    return <Redirect to={`/${year}/workspace`} replace />
  }

  if (!canViewAPR) {
    return <NotFoundPage />
  }

  const loading = loadingReport || loadingAprData || loadingKickstart
  const loaded = loadedReport || loadedAprData || loadedKickstart

  const refetchData = () => {
    refetchAprData()
    refetchReport()
    refetchKickstart()
  }

  const changeLockStatus = async (agencyData: AnnualAgencyProjectReport) => {
    const action = agencyData.is_unlocked ? 'lock' : 'unlock'
    const response = await confirm({
      title: `${agencyData.agency.name} report ${action}`,
      message: `Are you sure you want to ${action} the ${agencyData.agency.name} report?`,
    })

    if (!response) {
      return
    }

    try {
      await api(
        `api/annual-project-report/${year}/agency/${agencyData.agency_id}/toggle-lock/`,
        {
          method: 'POST',
          data: {
            is_unlocked: !agencyData.is_unlocked,
          },
        },
      )

      refetchData()
      enqueueSnackbar(<>Report {action} successful.</>, {
        variant: 'success',
      })
    } catch (e) {
      // TODO: better error reporting
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  const saveAPR = async () => {
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
      await api(`api/annual-project-report/mlfs/${year}/bulk-update/`, {
        data: {
          project_reports: allData,
        },
        method: 'POST',
      })

      refetchData()
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

  const kickstartNewAPR = async () => {
    const response = await confirm({
      title: 'Kickstart new APR',
      message: `Are you sure you want to kickstart a new APR for the year ${kickstartAPR?.next_year}?`,
    })

    if (!response) {
      return
    }

    try {
      const apiResponse = await api(`api/annual-project-report/kick-start/`, {
        method: 'POST',
      })

      enqueueSnackbar(
        <>Kickstarted new APR. Navigating to the new workspace.</>,
        {
          variant: 'success',
        },
      )
      setTimeout(() => {
        navigate(`/${apiResponse.year}/mlfs/workspace`)

        // Data that depends on the year will auto-refetch
        refetchKickstart()
        refetchAPRCurrentYear()
      }, 2000)
    } catch (e) {
      // TODO: better error reporting
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  return (
    <PageWrapper>
      {/* "~" means absolute, outside the nested context */}
      <BackLink url="~/projects" text="IA/BA Portal" />
      <PageHeading className="mb-1 flex min-w-fit items-center gap-x-2">
        {`Secretariat - Annual Project Report Workspace`}
        <AprYearDropdown />
        <span className="rounded border border-solid px-1 text-lg">
          {progressReport?.endorsed ? 'ENDORSED' : 'DRAFT'}
        </span>
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
          <div className="mb-2 flex gap-x-2">
            {activeTab === 0 && canUpdateAPR && (
              <Button
                disabled={loading}
                variant="contained"
                color="secondary"
                onClick={saveAPR}
              >
                Save
              </Button>
            )}
            {activeTab === 0 && kickstartAPR && (
              <Button
                disabled={loading || !canKickstartAPR}
                variant="contained"
                color="secondary"
                onClick={kickstartNewAPR}
              >
                Launch new APR{' '}
                {kickstartAPR.next_year && `(${kickstartAPR.next_year})`}
              </Button>
            )}
            <Button
              disabled={loading}
              variant="contained"
              onClick={() => {
                setIsEndorseModalOpen(true)
              }}
            >
              Endorse APR
            </Button>
          </div>
        </div>

        <div
          className={cx({ hidden: activeTab !== 0 })}
          id="tabpanel-projects"
          aria-labelledby="tab-projects"
          role="tabpanel"
        >
          <Alert
            className="bg-mlfs-bannerColor"
            icon={<IoInformationCircleOutline size={24} />}
            severity="info"
          >
            Viewing project reports for all agencies. Use filters for viewing
            less reports.
          </Alert>
          {hasValidationErrors && (
            <ValidationErrors validationErrors={validationErrors} />
          )}

          <div className="mb-2 mt-4 flex justify-between">
            {/* Filters section */}
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Agency filter */}
                <Field
                  Input={{ placeholder: 'Agency' }}
                  options={getFilterOptions(filters, agencies, 'agency')}
                  widget="autocomplete"
                  multiple={true}
                  value={[]}
                  getOptionLabel={(option: any) => option?.name}
                  popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
                  FieldProps={{ className: 'mb-0 md:w-24 BPList' }}
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
                  FieldProps={{ className: 'mb-0 md:w-24 BPList' }}
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
                  FieldProps={{ className: 'mb-0 md:w-24 BPList' }}
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
                  FieldProps={{ className: 'mb-0 md:w-24 BPList' }}
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

              {/* Also display the active filters */}
              {Object.values(filters).some(
                (filterArr) => filterArr.length > 0,
              ) && (
                <ul className="m-0 flex list-none flex-wrap gap-2 px-0">
                  {Object.entries(filters).flatMap(
                    ([filterKey, filterValue]) => {
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
                    },
                  )}
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
                </ul>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-x-2">
              <Button
                variant="text"
                startIcon={<FiDownload size={18} />}
                href={formatApiUrl(
                  `api/annual-project-report/mlfs/${year}/export/`,
                  params,
                )}
              >
                Export APR
              </Button>
              <MlfsLink
                button
                variant="text"
                startIcon={<FiEdit size={18} />}
                href={`/${year}/edit`}
                disabled={!canUpdateAPR}
              >
                Update APR (tabs)
              </MlfsLink>
              <Button variant="text" startIcon={<FiTable size={18} />} disabled>
                Generate summary tables
              </Button>
            </div>
          </div>

          {loaded && (
            <EditTable
              noRowsOverlayComponentParams={{
                label: 'No projects submitted by the IA/BAs yet',
              }}
              Toolbar={() => {
                return <div>Total rows: {allProjectReports.length ?? 0}</div>
              }}
              rowsVisible={100}
              gridRef={gridRef}
              dataTypeDefinitions={dataTypeDefinitions}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowData={allProjectReports}
              isDataFormatted={true}
              tooltipShowDelay={200}
              singleClickEdit={true}
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
                      <AccordionSummary
                        className="group flex-row-reverse gap-x-4"
                        expandIcon={
                          <div className="rounded-full border border-solid border-black bg-mlfs-hlYellow">
                            <MdExpandMore size={16} color="black" />
                          </div>
                        }
                      >
                        {/* w-full is necesary because MUI wraps our content in a flex container */}
                        <div className="flex w-full justify-between">
                          <div className="flex items-center gap-x-4">
                            <span className="text-lg font-medium">
                              {agencyData.agency.name}
                            </span>
                            <span
                              className={cx(
                                'rounded border border-solid px-1 py-0.5 text-sm',
                                {
                                  'border-transparent bg-primary text-white group-hover:border-mlfs-hlYellow group-hover:!text-mlfs-hlYellow':
                                    agencyData.status === 'draft',
                                },
                              )}
                            >
                              {agencyData.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-x-4">
                            <Button
                              className="hover:!text-mlfs-hlYellow group-hover:text-white"
                              variant="text"
                              startIcon={
                                agencyData.is_unlocked ? (
                                  <FiLock size={18} />
                                ) : (
                                  <FiUnlock size={18} />
                                )
                              }
                              onClick={(e) => {
                                e.stopPropagation()
                                changeLockStatus(agencyData)
                              }}
                              disabled={loading}
                            >
                              {agencyData.is_unlocked ? 'Lock' : 'Unlock'}
                            </Button>
                            {agencyData.files.length > 0 && (
                              <Button
                                className="hover:!text-mlfs-hlYellow group-hover:text-white"
                                variant="text"
                                startIcon={<FiDownload size={18} />}
                                href={formatApiUrl(
                                  `api/annual-project-report/${year}/agency/${agencyData.agency_id}/files/download-all/`,
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Download all files
                              </Button>
                            )}
                            <span className="text-sm font-medium">
                              Submitted:{' '}
                              <span className="font-bold">
                                {formatDate(agencyData.submitted_at)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </AccordionSummary>
                      <AccordionDetails>
                        {agencyData.files.length > 0 ? (
                          <FilesView files={agencyData.files} />
                        ) : (
                          'No files uploaded'
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Box>
      <EndorseAprModal
        isModalOpen={isEndorseModalOpen}
        setIsModalOpen={setIsEndorseModalOpen}
        disabled={loading || !canEndorseAPR}
        revalidateData={refetchData}
        year={year}
        currentData={progressReport}
      />
    </PageWrapper>
  )
}

function FilesView({ files }: { files: APRFile[] }) {
  const financialFile = files.find(
    (file) => file.file_type === 'annual_progress_financial_report',
  )
  const supportingFiles = files.filter(
    (file) => file.file_type === 'other_supporting_document',
  )

  return (
    <div className="flex flex-col gap-y-4">
      {financialFile && (
        <div className="flex flex-col gap-y-2">
          <p className="m-0 text-xl font-medium">
            Annual Progress & Financial Report
          </p>
          <FileView file={financialFile} />
        </div>
      )}
      {supportingFiles.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <p className="m-0 text-xl font-medium">Other Supporting Documents</p>
          <ul className="m-0 flex gap-x-4 p-0">
            {supportingFiles.map((file) => (
              <li key={file.id} className="m-0 list-none">
                <FileView file={file} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FileView({ file }: { file: APRFile }) {
  return (
    <span className="inline-flex gap-x-2 rounded bg-[#f5f5f5] p-2">
      <FiFile className="text-secondary" size={18} />
      <Link href={formatApiUrl(file.file_url)}>{file.file_name}</Link>
    </span>
  )
}

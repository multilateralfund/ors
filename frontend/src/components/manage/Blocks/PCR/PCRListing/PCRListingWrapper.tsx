import { useContext, useEffect, useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { ViewSelectorValuesType } from '@ors/components/manage/Blocks/BusinessPlans/types'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  RedirectBackButton,
  CreateButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PCRFiltersSelectedOpts from './PCRFiltersSelectedOpts'
import PCRFilters from './PCRFilters'
import PCRTable from './PCRTable'
import { getPcrHiddenFilters } from '../utils'
import {
  initialFilters,
  PCR_LISTING_STORAGE_KEY,
  booleanFieldsOpts,
} from '../constants'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'
import { useGetPcrFilters } from '../hooks/useGetPcrFilters'
import { loadLocalStorage, updateLocalStorage } from '@ors/storage'

import { ToggleButtonGroup, ToggleButton } from '@mui/material'
import { map, mapValues, omit } from 'lodash'

const viewOptions: { value: ViewSelectorValuesType; label: string }[] = [
  { value: 'list', label: 'Not completed PCRs' },
  { value: 'table', label: 'Completed PCRs' },
]

const notStoredFilters = ['offset', 'limit', 'pcr_submitted']

const getPcrSubmittedOpt = (view: ViewSelectorValuesType | null) =>
  view === 'table' ? booleanFieldsOpts[0] : booleanFieldsOpts[1]

const getParams = (
  filters: Record<string, any>,
  view: ViewSelectorValuesType | null,
) => {
  const hiddenFilters = getPcrHiddenFilters(view)

  return {
    ...mapValues(
      omit(filters, notStoredFilters) as Record<string, any>,
      (value: any, field: string) =>
        hiddenFilters.includes(field)
          ? ''
          : Array.isArray(value)
            ? value.map((item: any) => item.id).join(',')
            : value,
    ),
    ...initialFilters,
    pcr_submitted: getPcrSubmittedOpt(view).id,
  }
}

const getInitialState = () => {
  const stored = loadLocalStorage(PCR_LISTING_STORAGE_KEY) ?? {}
  const filters = {
    ...omit(stored.filters ?? {}, notStoredFilters),
    ...initialFilters,
    pcr_submitted: [getPcrSubmittedOpt('list')],
  }

  return { filters, params: getParams(filters, 'list') }
}

const PCRListingWrapper = () => {
  const form = useRef<any>()

  const { canEditPCR } = useContext(PermissionsContext)

  const [initialState] = useState(getInitialState)

  const [view, setView] = useState<ViewSelectorValuesType | null>('list')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [pcrId, setPcrId] = useState<number | null>(null)
  const [pcrEditable, setPcrEditable] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>(
    initialState.filters,
  )
  const key = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    updateLocalStorage(PCR_LISTING_STORAGE_KEY, {
      filters: omit(filters, notStoredFilters),
    })
  }, [filters])

  const pcrProjects = useGetPCRProjects(initialState.params)
  const { loading, setParams } = pcrProjects

  const pcrFilters = useGetPcrFilters(initialState.params)
  const { data: filterOptions, setParams: setParamsFilters } = pcrFilters

  const fieldToOptionsMapping: Record<string, any[]> = {
    country: filterOptions?.country ?? [],
    lead_agency: filterOptions?.lead_agency ?? [],
    cluster: filterOptions?.cluster ?? [],
    project_type: filterOptions?.project_type ?? [],
    sector: filterOptions?.sector ?? [],
    category: filterOptions?.category ?? [],
    status: filterOptions?.status ?? [],
    pcr_status: filterOptions?.pcr_status ?? [],
    pcr_due: filterOptions?.pcr_due ?? [],
    ad_hoc_pcr: filterOptions?.ad_hoc_pcr ?? [],
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
    setParamsFilters(params)
  }

  const filtersProps = {
    form,
    filters,
    fieldToOptionsMapping,
    handleFilterChange,
    handleParamsChange,
  }

  const handleChangeViewSelector = (value: ViewSelectorValuesType) => {
    setView(value)
    setProjectId(null)
    setPcrId(null)
    setPcrEditable(false)

    handleFilterChange({ pcr_submitted: [getPcrSubmittedOpt(value)] })
    handleParamsChange(getParams(filters, value))
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <RedirectBackButton />
            <PageHeading>Project Completion Reports</PageHeading>
          </div>
          <div className="ml-auto mt-auto">
            {view === 'list' ? (
              <CreateButton
                title="Raise a PCR"
                href={`/pcr/${projectId}/create`}
                isDisabled={!canEditPCR || !projectId || !!pcrId}
                className="!mb-0"
              />
            ) : (
              <CreateButton
                title="Edit PCR"
                href={`/pcr/${projectId}/${pcrId}/edit`}
                isDisabled={!pcrEditable || !projectId || !pcrId}
                className="!mb-0"
              />
            )}
          </div>
        </div>
      </HeaderTitle>
      <div className="flex flex-col gap-6" key={key}>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            <PCRFilters {...filtersProps} view={view} />
            <ToggleButtonGroup
              aria-label="PCR listing view"
              className="shrink-0 self-start"
              value={view}
              exclusive
              onChange={(_, value: ViewSelectorValuesType | null) => {
                if (value) {
                  handleChangeViewSelector(value)
                }
              }}
            >
              {map(viewOptions, ({ value, label }) => (
                <ToggleButton
                  key={value}
                  value={value}
                  className="h-[2.25rem] whitespace-nowrap rounded-none border-primary bg-white px-4 text-base normal-case tracking-wide text-primary first:rounded-l-lg last:rounded-r-lg"
                  classes={{ selected: '!bg-primary !text-mlfs-hlYellow' }}
                >
                  {label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
          <PCRFiltersSelectedOpts {...filtersProps} view={view} />
        </div>
        <PCRTable
          {...{
            pcrProjects,
            projectId,
            setProjectId,
            setPcrId,
            setPcrEditable,
            filters,
            view,
          }}
        />
      </div>
    </>
  )
}

export default PCRListingWrapper

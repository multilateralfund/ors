import { useContext, useMemo, useRef, useState } from 'react'

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
import { initialFilters, booleanFieldsOpts } from '../constants'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'
import { useGetPcrFilters } from '../hooks/useGetPcrFilters'

import { ToggleButtonGroup, ToggleButton } from '@mui/material'
import { map } from 'lodash'

const viewOptions: { value: ViewSelectorValuesType; label: string }[] = [
  { value: 'list', label: 'Without PCR' },
  { value: 'table', label: 'With PCR' },
]

const PCRListingWrapper = () => {
  const form = useRef<any>()

  const { canEditPCR } = useContext(PermissionsContext)

  const updatedInitialFilters = {
    ...initialFilters,
    pcr_submitted: [booleanFieldsOpts[1]],
  }
  const updatedInitialParams = { ...initialFilters, pcr_submitted: ['No'] }

  const [view, setView] = useState<ViewSelectorValuesType | null>('list')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [pcrId, setPcrId] = useState<number | null>(null)
  const [pcrEditable, setPcrEditable] = useState(false)
  const [filters, setFilters] = useState(updatedInitialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const pcrProjects = useGetPCRProjects(updatedInitialParams)
  const { loading, setParams } = pcrProjects

  const pcrFilters = useGetPcrFilters(updatedInitialParams)
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

    if (value === 'list') {
      handleFilterChange({
        pcr_status: [],
        pcr_submission_date_after: '',
        pcr_submission_date_before: '',
      })

      handleParamsChange({
        pcr_status: '',
        pcr_submission_date_after: '',
        pcr_submission_date_before: '',
        offset: 0,
      })
    } else {
      handleFilterChange({ pcr_due: [] })
      handleParamsChange({ pcr_due: '', offset: 0 })
    }

    const pcrSubmitted =
      value === 'table' ? booleanFieldsOpts[0] : booleanFieldsOpts[1]

    handleFilterChange({ pcr_submitted: [pcrSubmitted] })
    handleParamsChange({ pcr_submitted: pcrSubmitted.id, offset: 0 })
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
          <PCRFiltersSelectedOpts {...filtersProps} />
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

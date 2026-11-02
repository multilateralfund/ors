import { useMemo, useRef, useState } from 'react'

import TableViewSelector from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableViewSelector'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { ViewSelectorValuesType } from '@ors/components/manage/Blocks/BusinessPlans/types'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  RedirectBackButton,
  CreateButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRFiltersSelectedOpts from './PCRFiltersSelectedOpts'
import PCRFilters from './PCRFilters'
import PCRTable from './PCRTable'
import { initialFilters, booleanFieldsOpts } from '../constants'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'
import { useGetPcrFilters } from '../hooks/useGetPcrFilters'

const PCRListingWrapper = () => {
  const form = useRef<any>()

  const updatedInitialFilters = {
    ...initialFilters,
    pcr_submitted: [booleanFieldsOpts[1]],
  }
  const updatedInitialParams = { ...initialFilters, pcr_submitted: ['No'] }

  const [view, setView] = useState<ViewSelectorValuesType | null>('list')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [pcrId, setPcrId] = useState<number | null>(null)
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
    pcr_due: booleanFieldsOpts,
    ad_hoc_pcr: booleanFieldsOpts,
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
                isDisabled={!projectId || !!pcrId}
                className="!mb-0"
              />
            ) : (
              <CreateButton
                title="Edit PCR"
                href={`/pcr/${projectId}/${pcrId}/edit`}
                isDisabled={!projectId || !pcrId}
                className="!mb-0"
              />
            )}
          </div>
        </div>
      </HeaderTitle>
      <div className="flex flex-col gap-6" key={key}>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-4 md:flex-row">
            <PCRFilters {...filtersProps} view={view} />
            <TableViewSelector
              value={view as ViewSelectorValuesType}
              reverseViewOrder={true}
              tooltipText={['Not completed PCRs', 'Completed PCRs']}
              changeHandler={(_, value) => {
                if (value) {
                  handleChangeViewSelector(value)
                }
              }}
            />
          </div>
          <PCRFiltersSelectedOpts {...filtersProps} />
        </div>
        <PCRTable
          {...{ pcrProjects, projectId, setProjectId, setPcrId, filters, view }}
        />
      </div>
    </>
  )
}

export default PCRListingWrapper

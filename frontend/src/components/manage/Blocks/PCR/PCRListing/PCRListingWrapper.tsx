import { useMemo, useRef, useState, useContext } from 'react'

import TableViewSelector from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableViewSelector'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { ViewSelectorValuesType } from '@ors/components/manage/Blocks/BusinessPlans/types'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  RedirectBackButton,
  CreateButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRFiltersSelectedOpts from './PCRFiltersSelectedOpts'
import PCRFilters from './PCRFilters'
import PCRTable from './PCRTable'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'
import { initialFilters, categoryOpts, booleanFieldsOpts } from '../constants'
import { useStore } from '@ors/store'

import { filter } from 'lodash'

const PCRListingWrapper = () => {
  const form = useRef<any>()

  const { countries, agencies, clusters, project_types, sectors } =
    useContext(ProjectsDataContext)
  const projectsSlice = useStore((state) => state.projects)
  const statuses = filter(projectsSlice.statuses.data, (status) =>
    ['Completed', 'Financially completed'].includes(status.name),
  )

  const updatedInitialFilters = {
    ...initialFilters,
    pcr_due: [booleanFieldsOpts[0]],
    pcr_submitted: [booleanFieldsOpts[1]],
  }

  const updatedInitialParams = {
    ...initialFilters,
    pcr_due: ['Yes'],
    pcr_submitted: ['No'],
  }

  const [view, setView] = useState<ViewSelectorValuesType | null>('list')
  const [projectId, setProjectId] = useState<number | null>(null)
  const [pcrId, setPcrId] = useState<number | null>(null)
  const [filters, setFilters] = useState(updatedInitialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const pcrProjects = useGetPCRProjects(updatedInitialParams)
  const { loading, setParams } = pcrProjects

  const fieldToOptionsMapping: Record<string, any[]> = {
    country: countries,
    lead_agency: agencies,
    cluster: clusters,
    project_type: project_types,
    sector: sectors,
    category: categoryOpts,
    status: statuses,
    pcr_due: booleanFieldsOpts,
    ad_hoc_pcr: booleanFieldsOpts,
    pcr_submitted: booleanFieldsOpts,
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
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

    const isDue = value === 'list'
    const pcrDue = booleanFieldsOpts[isDue ? 0 : 1]
    const pcrSubmitted = booleanFieldsOpts[isDue ? 1 : 0]

    handleFilterChange({ pcr_due: [pcrDue], pcr_submitted: [pcrSubmitted] })

    handleParamsChange({
      pcr_due: pcrDue.id,
      pcr_submitted: pcrSubmitted.id,
      offset: 0,
    })
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
          <div className="ml-auto mt-auto flex flex-wrap justify-end gap-2.5">
            <CreateButton
              title="Raise a PCR"
              href={`/pcr/${projectId}/create`}
              isDisabled={!projectId || !!pcrId}
              className="!mb-0"
            />
            <CreateButton
              title="Edit PCR"
              href={`/pcr/${projectId}/${pcrId}/edit`}
              isDisabled={!projectId || !pcrId}
              className="!mb-0"
            />
          </div>
        </div>
      </HeaderTitle>
      <div className="flex flex-col gap-6" key={key}>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-4 md:flex-row">
            <PCRFilters {...filtersProps} />
            <TableViewSelector
              value={view as ViewSelectorValuesType}
              reverseViewOrder={true}
              tooltipText={['Due PCRs', 'Completed PCRs']}
              changeHandler={(_, value) => {
                if (value) {
                  handleChangeViewSelector(value)
                }
              }}
            />
          </div>
          <PCRFiltersSelectedOpts {...filtersProps} setView={setView} />
        </div>
        <PCRTable
          {...{ pcrProjects, projectId, setProjectId, setPcrId, filters }}
        />
      </div>
    </>
  )
}

export default PCRListingWrapper

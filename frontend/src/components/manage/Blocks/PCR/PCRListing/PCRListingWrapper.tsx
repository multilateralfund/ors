import { useMemo, useRef, useState, useContext } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  RedirectBackButton,
  CreateButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRFiltersSelectedOpts from './PCRFiltersSelectedOpts'
import PCRFilters from './PCRFilters'
import PCRTable from './PCRTable'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'
import { initialFilters, categoryOpts, booleanFieldsOpts } from '../constants'
import { useStore } from '@ors/store'

import { filter } from 'lodash'

const PCRListingWrapper = () => {
  const form = useRef<any>()

  const { regions } = useContext(PCRDataContext)
  const { countries, agencies, clusters, project_types, sectors, subsectors } =
    useContext(ProjectsDataContext)
  const projectsSlice = useStore((state) => state.projects)
  const statuses = filter(projectsSlice.statuses.data, (status) =>
    ['Completed', 'Financially completed'].includes(status.name),
  )

  const [projectId, setProjectId] = useState<number | null>(null)
  const [filters, setFilters] = useState(initialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const pcrProjects = useGetPCRProjects(initialFilters)
  const { loading, setParams } = pcrProjects

  const fieldToOptionsMapping: Record<string, any[]> = {
    region: regions,
    country: countries,
    lead_agency: agencies,
    cooperating_agency: agencies,
    cluster: clusters,
    project_type: project_types,
    sector: sectors,
    subsectors: subsectors,
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
            <CreateButton
              title="Raise a PCR"
              href={`/pcr/${projectId}/create`}
              isDisabled={!projectId}
              className="!mb-0"
            />
          </div>
        </div>
      </HeaderTitle>
      <div className="flex flex-col gap-6" key={key}>
        <div className="flex flex-col gap-2.5">
          <PCRFilters {...filtersProps} />
          <PCRFiltersSelectedOpts {...filtersProps} />
        </div>
        <PCRTable {...{ pcrProjects, projectId, setProjectId, filters }} />
      </div>
    </>
  )
}

export default PCRListingWrapper

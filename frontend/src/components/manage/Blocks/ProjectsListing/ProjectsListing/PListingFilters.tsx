'use client'

import ProjectsFilters from './ProjectsFilters'
import ProjectsFiltersSelectedOpts from './ProjectsFiltersSelectedOpts'

import { useMeetingOptions } from '@ors/components/manage/Utils/utilFunctions'
import { useStore } from '@ors/store'

const PListingFilters = ({
  mode,
  setFilters,
  setParams,
  projectFilters,
  ...rest
}: any) => {
  const { data: filterOptions, setParams: setParamsFilters } = projectFilters

  const projectSlice = useStore((state) => state.projects)
  const meetings = useMeetingOptions()

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
    setParamsFilters(params)
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  const props = {
    mode,
    projectSlice,
    meetings,
    handleFilterChange,
    handleParamsChange,
    ...rest,
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ProjectsFilters {...props} />
      <ProjectsFiltersSelectedOpts {...props} />
    </div>
  )
}

export default PListingFilters

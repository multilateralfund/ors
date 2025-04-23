'use client'

import ProjectsFilters from './ProjectsFilters'
import ProjectsFiltersSelectedOpts from './ProjectsFiltersSelectedOpts'

import { getMeetingOptions } from '@ors/components/manage/Utils/utilFunctions'
import { useStore } from '@ors/store'

const PListingFilters = ({ setFilters, setParams, ...rest }: any) => {
  const [commonSlice, projectSlice] = useStore((state) => [
    state.common,
    state.projects,
  ])
  const meetings = getMeetingOptions()

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  const props = {
    commonSlice,
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

'use client'

import { useStore } from '@ors/store'
import ProjectsFilters from './ProjectsFilters'
import ProjectsFiltersSelectedOpts from './ProjectsFiltersSelectedOpts'
import { getMeetingOptions } from '@ors/components/manage/Utils/utilFunctions'

const PListingFilters = ({ setFilters, setParams, ...rest }: any) => {
  const [commonSlice, projectSlice] = useStore((state) => [
    state.common,
    state.projects,
  ])
  const clusters = projectSlice.clusters.data || []
  const meetings = getMeetingOptions()

  function handleParamsChange(params: { [key: string]: any }) {
    setParams(params)
  }

  function handleFilterChange(newFilters: { [key: string]: any }) {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ProjectsFilters
        {...{
          commonSlice,
          projectSlice,
          clusters,
          meetings,
          handleFilterChange,
          handleParamsChange,
        }}
        {...rest}
      />
      <ProjectsFiltersSelectedOpts
        {...{
          commonSlice,
          projectSlice,
          clusters,
          meetings,
          handleFilterChange,
          handleParamsChange,
        }}
        {...rest}
      />
    </div>
  )
}

export default PListingFilters

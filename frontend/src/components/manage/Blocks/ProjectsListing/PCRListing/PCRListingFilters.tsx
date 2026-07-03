'use client'

import PCRFilters from './PCRFilters'
import PCRFiltersSelectedOpts from './PCRFiltersSelectedOpts'

const PCRListingFilters = ({
  setFilters,
  setParams,
  pcrFilters,
  ...rest
}: any) => {
  const { data: filterOptions, setParams: setParamsFilters } = pcrFilters

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
    setParamsFilters(params)
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  const props = {
    filterOptions,
    handleFilterChange,
    handleParamsChange,
    ...rest,
  }

  return (
    <div className="flex flex-col gap-2.5">
      <PCRFilters {...props} />
      <PCRFiltersSelectedOpts {...props} />
    </div>
  )
}

export default PCRListingFilters

import PCRFilters from './PCRFilters'
import PCRFiltersSelectedOpts from './PCRFiltersSelectedOpts'
import { useStore } from '@ors/store'
import { filter } from 'lodash'

const PCRFiltersWrapper = ({
  PCRFiltersOpts,
  filters,
  setFilters,
  setParams,
  ...rest
}: any) => {
  const { data: filterOptions, setParams: setParamsFilters } = PCRFiltersOpts

  const statuses = useStore((state) => state?.projects.statuses.data)
  const statusFilterOpts = filter(statuses, (status) =>
    ['Completed', 'Financially completed'].includes(status.name),
  )

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
    setParamsFilters(params)
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  const props = {
    filterOptions,
    statusFilterOpts,
    filters,
    handleFilterChange,
    handleParamsChange,
    ...rest,
  }

  return (
    <div className="flex flex-col gap-2.5">
      <PCRFilters {...props} />
      {/* <PCRFiltersSelectedOpts {...props} /> */}
    </div>
  )
}

export default PCRFiltersWrapper

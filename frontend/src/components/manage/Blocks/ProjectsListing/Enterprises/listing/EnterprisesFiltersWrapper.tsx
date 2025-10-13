'use client'

import EnterprisesFilters from './EnterprisesFilters'
import EnterprisesFiltersSelectedOpts from './EnterprisesFiltersSelectedOpts'
import { useGetEnterpriseStatuses } from '../../hooks/useGetEnterpriseStatuses'
import { useStore } from '@ors/store'

const EnterprisesFiltersWrapper = ({ setFilters, setParams, ...rest }: any) => {
  const commonSlice = useStore((state) => state.common)
  const enterpriseStatuses = useGetEnterpriseStatuses()

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  const props = {
    commonSlice,
    enterpriseStatuses,
    handleFilterChange,
    handleParamsChange,
    ...rest,
  }

  return (
    <div className="flex flex-col gap-2.5">
      <EnterprisesFilters {...props} />
      <EnterprisesFiltersSelectedOpts {...props} />
    </div>
  )
}

export default EnterprisesFiltersWrapper

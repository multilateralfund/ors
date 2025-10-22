'use client'

import EnterprisesFilters from './EnterprisesFilters'
import EnterprisesFiltersSelectedOpts from './EnterprisesFiltersSelectedOpts'
import { useGetEnterpriseStatuses } from '../../hooks/useGetEnterpriseStatuses'

const EnterprisesFiltersWrapper = ({ setFilters, setParams, ...rest }: any) => {
  const enterpriseStatuses = useGetEnterpriseStatuses()

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  const props = {
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

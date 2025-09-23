'use client'

import EnterprisesFilters from './EnterprisesFilters'
import EnterprisesFiltersSelectedOpts from './EnterprisesFiltersSelectedOpts'
import { useGetEnterpriseStatuses } from '../../hooks/useGetEnterpriseStatuses'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const EnterprisesFiltersWrapper = ({ setFilters, setParams, ...rest }: any) => {
  const commonSlice = useStore((state) => state.common)

  const statuses = useGetEnterpriseStatuses()
  const enterpriseStatuses = map(statuses, (status) => ({
    id: status[0],
    label: status[1],
    name: status[1],
  }))

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  const props = {
    commonSlice,
    handleFilterChange,
    handleParamsChange,
    ...rest,
  }

  return (
    <div className="flex flex-col gap-2.5">
      <EnterprisesFilters {...{ enterpriseStatuses, ...props }} />
      <EnterprisesFiltersSelectedOpts {...{ enterpriseStatuses, ...props }} />
    </div>
  )
}

export default EnterprisesFiltersWrapper

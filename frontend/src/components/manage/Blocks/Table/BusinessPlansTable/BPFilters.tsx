'use client'

import ActivitiesFilters from '@ors/components/manage/Blocks/BusinessPlans/ActivitiesFilters'
import TableDateSwitcher from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableDateSwitcher'
import TableViewSelector from './TableViewSelector'
import { useStore } from '@ors/store'

const ACTIVITIES_PER_PAGE_TABLE = 100
const ACTIVITIES_PER_PAGE_LIST = 20

export default function BPFilters({
  displayOptions,
  gridOptions,
  setDisplayOptions,
  setFilters,
  setGridOptions,
  setParams,
  withAgency = false,
  ...rest
}: any) {
  const commonSlice = useStore((state) => state.common)
  const bpSlice = useStore((state) => state.businessPlans)
  const projects = useStore((state) => state.projects)
  const clusters = projects.clusters.data || []

  function handleParamsChange(params: { [key: string]: any }) {
    setParams(params)
  }

  function handleFilterChange(newFilters: { [key: string]: any }) {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  return (
    <div className="bp-table-toolbar mb-6 flex flex-col justify-between gap-x-[7rem] gap-y-4 md:flex-row md:items-center">
      <ActivitiesFilters
        {...{
          bpSlice,
          clusters,
          commonSlice,
          handleFilterChange,
          handleParamsChange,
          withAgency,
        }}
        {...rest}
      />
      <div className="flex gap-4 self-start">
        <TableDateSwitcher changeHandler={setGridOptions} value={gridOptions} />
        <TableViewSelector
          value={displayOptions}
          changeHandler={(_, value) => {
            setParams({
              limit:
                value === 'list'
                  ? ACTIVITIES_PER_PAGE_LIST
                  : ACTIVITIES_PER_PAGE_TABLE,
              offset: 0,
            })
            setDisplayOptions(value)
          }}
        />
      </div>
    </div>
  )
}

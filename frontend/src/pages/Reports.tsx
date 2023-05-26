import type { FC } from 'react'
import { TableData } from '@/components/table/TableData'
import { useGetSubstancesQuery, useGetUsageQuery } from '@/services/api'

export const ReportsPage: FC = function () {
  useGetSubstancesQuery(null)
  useGetUsageQuery(null)

  return (
    <div>
      <TableData />
    </div>
  )
}

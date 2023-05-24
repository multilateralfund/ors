import type { FC } from 'react'
import { TableData } from '@/components/table/TableData'
import { useGetSubstancesQuery, useGetUsageQuery } from '@/services/api'
import { selectSubstancesAnnexA, selectUsages } from '@/slices/reportSlice'

export const ReportsPage: FC = function () {
  useGetSubstancesQuery(null)
  useGetUsageQuery(null)

  return (
    <div>
      <TableData />
    </div>
  )
}

import type { FC } from 'react'
import { TableData } from '@/components/table/TableData'
import { Tabs } from 'flowbite-react'
import { useGetSubstancesQuery, useGetUsageQuery } from '@/services/api'

export const ReportsPage: FC = function () {
  useGetSubstancesQuery(null)
  useGetUsageQuery(null)

  return (
    <div className="mt-2">
      <Tabs.Group aria-label="" style="fullWidth">
        <Tabs.Item title="Section A">
          <TableData />
        </Tabs.Item>
        <Tabs.Item title="Section B">Section B</Tabs.Item>
        <Tabs.Item title="Section C">Section C</Tabs.Item>
        <Tabs.Item title="Section D">Section D</Tabs.Item>
        <Tabs.Item title="Section E">Section E</Tabs.Item>
        <Tabs.Item title="Section F">Section F</Tabs.Item>
      </Tabs.Group>
    </div>
  )
}

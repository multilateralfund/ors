import { FC, useState, useMemo } from 'react'
import { TableData } from '@/components/table/TableData'
import { Tabs } from 'flowbite-react'
import { useGetSubstancesQuery, useGetUsageQuery } from '@/services/api'

export const ReportsPage: FC = function () {
  const [selectedTab, setSelectedTab] = useState(0)
  useGetSubstancesQuery(null)
  useGetUsageQuery(null)

  const tableComponent = useMemo(() => {
    return <TableData selectedTab={selectedTab} />
  }, [selectedTab])

  return (
    <div className="mt-2">
      <Tabs.Group
        aria-label=""
        style="fullWidth"
        onActiveTabChange={setSelectedTab}
      >
        <Tabs.Item title="Section A">{tableComponent}</Tabs.Item>
        <Tabs.Item title="Section B">{tableComponent}</Tabs.Item>
        <Tabs.Item title="Section C">{tableComponent}</Tabs.Item>
        <Tabs.Item title="Section D">{tableComponent}</Tabs.Item>
        <Tabs.Item title="Section E">{tableComponent}</Tabs.Item>
        <Tabs.Item title="Section F">{tableComponent}</Tabs.Item>
      </Tabs.Group>
    </div>
  )
}

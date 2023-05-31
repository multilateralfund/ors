import { FC, useState, useMemo } from 'react'
import { Tabs } from 'flowbite-react'
import { TableData } from '@/components/table/TableData'
import { AddSubstancesModal } from '@/components/shared/AddSubstanceModal'
import { useGetSubstancesQuery, useGetUsageQuery } from '@/services/api'
import { mappingTabsWithSections } from '@/utils/mappings'

export const ReportsPage: FC = function () {
  const [selectedTab, setSelectedTab] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editRow, setEditRow] = useState<unknown>(false)

  useGetSubstancesQuery(null)
  useGetUsageQuery(null)

  const withSection = useMemo(
    () => mappingTabsWithSections[selectedTab] || undefined,
    [selectedTab],
  )

  const tableComponent = useMemo(() => {
    return (
      <TableData
        withSection={withSection}
        selectedTab={selectedTab}
        showModal={() => setShowModal(true)}
        onEditRow={row => {
          setEditRow(row)
          setShowModal(true)
        }}
      />
    )
  }, [withSection])

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
        <Tabs.Item title="Section D">TBD</Tabs.Item>
        <Tabs.Item title="Section E">TBD</Tabs.Item>
        <Tabs.Item title="Section F">TBD</Tabs.Item>
      </Tabs.Group>

      <AddSubstancesModal
        show={showModal}
        editValues={editRow}
        withSection={withSection}
        onClose={() => {
          setShowModal(false)
          setEditRow(false)
        }}
      />
    </div>
  )
}

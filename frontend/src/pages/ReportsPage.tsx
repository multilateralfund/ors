import { FC, useState, useMemo } from 'react'
import { Tabs } from 'flowbite-react'
import { useSelector } from 'react-redux'
import { TableData } from '@/components/table/TableData'
import { AddSubstancesModal } from '@/components/shared/AddSubstanceModal'
import { useGetSubstancesQuery, useGetUsageQuery } from '@/services/api'
import {
  selectRecordsDataBySection,
  ReportDataType,
} from '@/slices/reportSlice'
import { mappingTabsWithSections } from '@/utils/mappings'
import { RootState } from '@/store'

export const ReportsPage: FC = function () {
  const [selectedTab, setSelectedTab] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editRow, setEditRow] = useState<Partial<ReportDataType>>()

  useGetSubstancesQuery(null)
  useGetUsageQuery(null)

  const data = useSelector((state: RootState) =>
    selectRecordsDataBySection(state, Number(selectedTab)),
  )

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
        data={data}
        onEditRow={row => {
          setEditRow(row)
          setShowModal(true)
        }}
      />
    )
  }, [withSection, data])

  return (
    <div className="mt-2">
      <Tabs.Group
        style="fullWidth"
        onActiveTabChange={setSelectedTab}
        className="mt-3"
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
        sectionId={selectedTab}
        onClose={() => {
          setShowModal(false)
          setEditRow(undefined)
        }}
      />
    </div>
  )
}

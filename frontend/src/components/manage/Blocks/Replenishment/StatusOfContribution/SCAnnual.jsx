'use client'
import React, { useMemo, useState } from 'react'

import ConfirmDialog from '@ors/components/manage/Blocks/Replenishment/ConfirmDialog'
import DisputedContributionDialog from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/DisputedContributionDialog'
import { AnnualIndicators } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/Indicators'
import useGetSCData from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/useGetSCData'
import {
  SC_COLUMNS,
  formatTableRows,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import { sortTableData } from '@ors/components/manage/Blocks/Replenishment/utils'

export default function SCAnnual({ year }) {
  const { data, extraRows, refetchSCData, rows } = useGetSCData(year)

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState(1)

  const sortedData = useMemo(
    function () {
      return sortTableData(rows, SC_COLUMNS[sortOn].field, sortDirection)
    },
    [rows, sortOn, sortDirection],
  )

  console.log(rows)

  const countriesInTable = useMemo(() => {
    return rows.map(({ country, country_id }) => ({ country, country_id }))
  }, [rows])

  function handleSort(column) {
    setSortDirection((direction) => (column === sortOn ? -direction : 1))
    setSortOn(column)
  }

  const indicatorsData = useMemo(() => {
    return rows.reduce(
      (acc, { outstanding_contributions }) => {
        let value = outstanding_contributions
        if (value > -1 && value < 1) {
          value = 0
        }
        if (value <= 0) {
          acc.contributions += 1
        }
        return acc
      },
      {
        contributions: 0,
      },
    )
  }, [rows])

  const totalPledge = useMemo(() => {
    const cashPayments = Number(data?.total?.cash_payments) || 0
    const bilateralAssistance = Number(data?.total?.bilateral_assistance) || 0
    const promissoryNotes = Number(data?.total?.promissory_notes) || 0
    const agreedContributions = Number(data?.total?.agreed_contributions) || 1
    const total =
      ((cashPayments + bilateralAssistance + promissoryNotes) /
        agreedContributions) *
      100
    return total.toLocaleString('en-US', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
  }, [data])

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [rowToDelete, setRowToDelete] = useState(null)

  function promptDeleteRow(rowId) {
    setRowToDelete(rowId)
    setShowDeleteModal(true)
  }

  function handleDeleteRow(rowId) {
    const row = extraRows[rowId]
    console.log(row)
    refetchSCData()
  }

  return (
    <>
      {showDeleteModal ? (
        <ConfirmDialog
          onCancel={() => {
            setRowToDelete(null)
            setShowDeleteModal(false)
          }}
          onSubmit={() => handleDeleteRow(rowToDelete)}
        >
          <div className="text-lg">
            Are you sure you want to delete Disputed Contribution for{' '}
            {extraRows[rowToDelete].country_to_display} ?
          </div>
        </ConfirmDialog>
      ) : null}
      <div className="flex flex-col items-start gap-6">
        <AnnualIndicators
          data={indicatorsData}
          totalPledge={totalPledge}
          year={year}
        />
        <Table
          adminButtons={false}
          columns={SC_COLUMNS}
          enableEdit={false}
          enableSort={true}
          extraRows={formatTableRows(extraRows)}
          rowData={formatTableRows(sortedData)}
          sortDirection={sortDirection}
          sortOn={sortOn}
          textPosition="center"
          onDelete={promptDeleteRow}
          onSort={handleSort}
        />
        <DisputedContributionDialog
          countryOptions={countriesInTable}
          refetchSCData={refetchSCData}
          year={year}
        />
      </div>
    </>
  )
}

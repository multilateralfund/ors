'use client'
import React, { useContext, useMemo, useState } from 'react'

import ConfirmDialog from '@ors/components/manage/Blocks/Replenishment/ConfirmDialog'
import BilateralAssistanceDialog from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/BilateralAssistanceDialog'
import DisputedContributionDialog from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/DisputedContributionDialog'
import { AnnualIndicators } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/Indicators'
import useGetSCData from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/useGetSCData'
import {
  SC_COLUMNS,
  formatTableRows,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import { sortTableData } from '@ors/components/manage/Blocks/Replenishment/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { api } from '@ors/helpers'

import { SortDirection } from '../Table/types'

export default function SCAnnual({ year }: { year: string }) {
  const { data, extraRows, refetchSCData, rows } = useGetSCData(year)

  const ctx = useContext(ReplenishmentContext)
  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState<SortDirection>(1)

  const sortedData = useMemo(
    function () {
      return sortTableData(rows, SC_COLUMNS[sortOn].field, sortDirection)
    },
    [rows, sortOn, sortDirection],
  )

  const countriesInTable = useMemo(() => {
    return rows.map(({ country, country_id }) => ({ country, country_id }))
  }, [rows])

  function handleSort(column: number) {
    setSortDirection(
      (direction) => (column === sortOn ? -direction : 1) as SortDirection,
    )
    setSortOn(column)
  }

  const indicatorsData = useMemo(() => {
    return rows.reduce(
      (acc, { cash_payments, outstanding_contributions }) => {
        let value = outstanding_contributions
        const cash_value = cash_payments
        if (value >= -5 && value <= 5) {
          value = 0
        }
        if (value < 0) {
          acc.contributions_advance += 1
          acc.contributions_full += 1
        } else if (value === 0) {
          acc.contributions_full += 1
        } else {
          acc.outstanding_contributions += 1
        }
        if (cash_value >= 5) {
          acc.contributions += 1
        }
        return acc
      },
      {
        contributions: 0,
        contributions_advance: 0,
        contributions_full: 0,
        outstanding_contributions: 0,
        percentage_total_paid_current_year:
          data.percentage_total_paid_current_year,
      },
    )
  }, [rows, data.percentage_total_paid_current_year])

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
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
  }, [data])

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<null | number>(null)

  function promptDeleteRow(rowId: number) {
    setRowToDelete(rowId)
    setShowDeleteModal(true)
  }

  async function handleDeleteRow(rowId: number) {
    const row = extraRows[rowId]
    await api(`api/replenishment/disputed-contributions/${row.disputed_id}`, {
      method: 'DELETE',
    })
    setShowDeleteModal(false)
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
          onSubmit={() => handleDeleteRow(rowToDelete!)}
        >
          <div className="text-lg">
            Are you sure you want to delete Disputed Contribution for{' '}
            {extraRows[rowToDelete!].country_to_display} ?
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
          enableSort={true}
          extraRows={formatTableRows(extraRows)}
          rowData={formatTableRows(sortedData)}
          sortDirection={sortDirection}
          sortOn={sortOn}
          textPosition="center"
          onDelete={promptDeleteRow}
          onSort={handleSort}
        />
        <div className="w-full lg:max-w-[50%]">
          <p>
            <sup>*</sup> Additional amount on disputed contributions from the
            United States of America.{' '}
          </p>
        </div>
        {ctx.isTreasurer && (
          <div className="flex items-center gap-x-2 print:hidden">
            <DisputedContributionDialog
              countryOptions={countriesInTable}
              refetchSCData={refetchSCData}
              year={year}
            />
            <BilateralAssistanceDialog
              countryOptions={countriesInTable}
              refetchSCData={refetchSCData}
              rows={rows}
              year={year}
            />
          </div>
        )}
      </div>
    </>
  )
}

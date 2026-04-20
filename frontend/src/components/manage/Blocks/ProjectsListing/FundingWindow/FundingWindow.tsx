import * as mui from '@mui/material'

import ViewTable from '@ors/components/manage/Form/ViewTable.tsx'
import { GridOptions } from 'ag-grid-community'
import {
  FundingWindowPostType,
  FundingWindowType,
} from '@ors/types/api_funding_window.ts'
import { useGetFundingWindow } from '@ors/components/manage/Blocks/ProjectsListing/FundingWindow/hooks.ts'
import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils.ts'
import { FaPlusCircle, FaEdit, FaFileDownload } from 'react-icons/fa'
import React, { useState } from 'react'
import FundingWindowModal from './FundingWindowModal.tsx'
import api from '../../../../../helpers/Api/_api.ts'
import Link from '@ors/components/ui/Link/Link.tsx'
import { formatApiUrl } from '@ors/helpers'

const dollarValueOrNull = (value: number | string) =>
  value ? `$${formatNumberValue(value)}` : null

export default function FundingWindow() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<FundingWindowType | null>(null)
  const { loaded, loading, results, count, refetch, setParams } =
    useGetFundingWindow()

  const handleOpenCreate = () => {
    setEditData(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (data: FundingWindowType) => {
    setEditData(data)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditData(null)
    refetch()
  }

  const handleSubmit = async (
    requestParams: FundingWindowPostType,
    id?: number,
  ) => {
    const url = id ? `api/funding-window/${id}/` : 'api/funding-window'
    const method = id ? 'PUT' : 'POST'

    console.log(requestParams)

    await api(url, {
      data: requestParams,
      method,
    })
    handleModalClose()
  }

  const columnDefs: GridOptions<FundingWindowType>['columnDefs'] = [
    {
      headerName: 'Meeting number',
      field: 'meeting.number',
      tooltipField: 'meeting.number',
    },
    {
      headerName: 'Decision number',
      field: 'decision.number',
      tooltipField: 'decision.number',
    },
    {
      headerName: 'Funding window description',
      field: 'description',
      tooltipField: 'description',
    },
    {
      headerName: 'Funding window amount (US$)',
      field: 'amount',
      tooltipField: 'amount',
      valueGetter: (params) => {
        return dollarValueOrNull(params?.data?.amount ?? 0)
      },
    },
    {
      headerName: 'Total project funding approved (US$)',
      field: 'total_project_funding_approved',
      tooltipField: 'total_project_funding_approved',
      valueGetter: (params) => {
        return (
          dollarValueOrNull(
            params?.data?.total_project_funding_approved ?? 0,
          ) ?? '0'
        )
      },
    },
    {
      headerName: 'Balance (US$)',
      field: 'balance',
      tooltipField: 'balance',
      valueGetter: (params) => {
        return dollarValueOrNull(params?.data?.balance ?? 0)
      },
    },
    {
      headerName: 'Remarks',
      field: 'remarks',
      tooltipField: 'remarks',
      sortable: false,
    },
    {
      headerName: 'Actions',
      sortable: false,
      filter: false,
      width: 100,
      cellRenderer: (params: { data: FundingWindowType }) => (
        <mui.IconButton
          size="small"
          onClick={() => handleOpenEdit(params.data)}
          title="Edit"
        >
          <FaEdit size={16} />
        </mui.IconButton>
      ),
    },
  ]

  return (
    <>
      <mui.Box>
        <div className="flex items-center justify-end gap-3 py-3">
          <Link
            button
            href={formatApiUrl('api/funding-window/export/')}
            startIcon={<FaFileDownload size={14} />}
            variant="contained"
          >
            Download report
          </Link>
          <mui.Button
            variant="contained"
            color="primary"
            startIcon={<FaPlusCircle size={14} />}
            onClick={handleOpenCreate}
          >
            Add funding window
          </mui.Button>
        </div>

        <FundingWindowModal
          open={modalOpen}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          editData={editData}
        />

        <ViewTable
          columnDefs={[...columnDefs]}
          defaultColDef={{
            headerClass: 'ag-text-center',
            cellClass: 'ag-text-center ag-cell-ellipsed',
            minWidth: 90,
            resizable: true,
            sortable: true,
          }}
          domLayout="normal"
          enablePagination={false}
          alwaysShowHorizontalScroll={false}
          loaded={loaded}
          loading={loading}
          resizeGridOnRowUpdate={true}
          rowCount={count}
          rowData={results}
          rowBuffer={120}
          rowsVisible={90}
          tooltipShowDelay={200}
          context={{ disableValidation: true }}
          components={{
            agColumnHeader: undefined,
            agTextCellRenderer: undefined,
          }}
          onSortChanged={({ api }) => {
            const ordering = api
              .getColumnState()
              .filter((column) => !!column.sort)
              .map(
                (column) =>
                  (column.sort === 'asc' ? '' : '-') +
                  column.colId.replaceAll('.', '__'),
              )
              .join(',')
            setParams({ offset: 0, ordering })
          }}
        />
      </mui.Box>
    </>
  )
}

'use client'

import { useRef, useState } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import DeletePEnterpriseModal from './DeletePEnterpriseModal'
import getColumnDefs from '../../Enterprises/listing/schema'
import { useGetProjectEnterprises } from '../../hooks/useGetProjectEnterprises'
import { getPaginationSelectorOpts } from '../../utils'
import { PROJECTS_PER_PAGE } from '../../constants'
import { api } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'

const PEnterprisesTable = ({
  enterprises,
}: {
  enterprises: ReturnType<typeof useGetProjectEnterprises>
}) => {
  const gridApiRef = useRef<any>()

  const { count, loaded, loading, results, setParams } = enterprises

  const [idToDelete, setIdToDelete] = useState<number | null>(null)

  const { columnDefs, defaultColDef } = getColumnDefs(setIdToDelete)
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count, 500)

  const handleDeleteProjectEnterprise = async () => {
    try {
      await api(`api/project-enterprise/${idToDelete}`, {
        method: 'DELETE',
      })

      setParams((prev: any) => ({ ...prev }))
    } catch (error) {
      enqueueSnackbar(
        <>Could not delete project enterprise. Please try again.</>,
        {
          variant: 'error',
        },
      )
    }
    setIdToDelete(null)
  }

  return (
    <>
      {loaded && (
        <ViewTable
          getRowId={(props) => props.data.id}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          domLayout="normal"
          suppressScrollOnNewData={true}
          enablePagination={true}
          loaded={loaded}
          loading={loading}
          paginationPageSize={PROJECTS_PER_PAGE}
          paginationPageSizeSelector={paginationPageSizeSelectorOpts}
          resizeGridOnRowUpdate={true}
          rowBuffer={100}
          rowCount={count}
          rowData={results}
          rowsVisible={90}
          tooltipShowDelay={200}
          onGridReady={({ api }) => {
            gridApiRef.current = api
          }}
          components={{
            agColumnHeader: undefined,
            agTextCellRenderer: undefined,
          }}
          onPaginationChanged={({ page, rowsPerPage }) => {
            setParams({
              limit: rowsPerPage,
              offset: page * rowsPerPage,
            })
          }}
          onSortChanged={({ api }) => {
            const ordering = api
              .getColumnState()
              .filter((column) => !!column.sort)
              .map(
                ({ sort, colId }) =>
                  (sort === 'asc' ? '' : '-') +
                  (colId === 'status'
                    ? colId
                    : 'enterprise__' + colId.split('.')[1]),
              )
              .join(',')
            setParams({ offset: 0, ordering })
          }}
        />
      )}
      {idToDelete && (
        <DeletePEnterpriseModal
          {...{ idToDelete, setIdToDelete }}
          onAction={handleDeleteProjectEnterprise}
        />
      )}
    </>
  )
}

export default PEnterprisesTable

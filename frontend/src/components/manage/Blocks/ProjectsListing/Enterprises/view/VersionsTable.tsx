'use client'

import { useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import getColumnDefs from '../listing/schema'
import { EnterpriseEntityType } from '../../interfaces'

const VersionsTable = ({
  versions = [],
}: {
  versions: EnterpriseEntityType[]
}) => {
  const gridApiRef = useRef<any>()

  const { columnDefs, defaultColDef } = getColumnDefs(versions, 'versions')
  const count = versions.length

  return (
    <ViewTable
      getRowId={(props) => props.data.id}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      domLayout="normal"
      suppressScrollOnNewData={true}
      enablePagination={false}
      resizeGridOnRowUpdate={true}
      rowBuffer={100}
      rowCount={count}
      rowData={versions}
      rowsVisible={90}
      tooltipShowDelay={200}
      onGridReady={({ api }) => {
        gridApiRef.current = api
      }}
      components={{
        agColumnHeader: undefined,
        agTextCellRenderer: undefined,
      }}
    />
  )
}

export default VersionsTable

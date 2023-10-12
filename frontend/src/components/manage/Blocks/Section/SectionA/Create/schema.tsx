import { useMemo } from 'react'

import { Button, IconButton, Typography } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { IoTrash } from '@react-icons/all-files/io5/IoTrash'

function useGridOptions(props: {
  onRemoveSubstance: any
  openAddSubstanceModal: any
  usages: any
}) {
  const { onRemoveSubstance, openAddSubstanceModal, usages } = props

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellRenderer: (props: any) => {
            if (props.data.rowType === 'control') {
              return (
                <Button
                  className="w-full"
                  variant="contained"
                  onClick={openAddSubstanceModal}
                >
                  + Add substance
                </Button>
              )
            }
            return (
              <Typography className={props.className} component="span">
                {!props.data.rowType && !props.data.mandatory && (
                  <>
                    <IconButton
                      color="error"
                      onClick={() => {
                        onRemoveSubstance(props)
                      }}
                    >
                      <IoTrash size="1rem" />
                    </IconButton>{' '}
                  </>
                )}
                {props.value}
              </Typography>
            )
          },
          cellRendererParams: (props: any) => ({
            className: cx({
              'font-bold': includes(['group', 'total'], props.data.rowType),
            }),
          }),
          field: 'display_name',
          headerClass: 'ag-text-left',
          headerName: 'Substance',
          initialWidth: 300,
          minWidth: 160,
          // pinned: 'left',
        },
        ...(usages.length
          ? [
              {
                children: [
                  ...usages,
                  {
                    id: 'total_usages',
                    aggFunc: 'sumTotalUsages',
                    category: 'usage',
                    field: 'total_usages',
                    headerName: 'TOTAL',
                    initialWidth: 140,
                  },
                ],
                headerGroupComponent: 'agColumnHeaderGroup',
                headerName: 'Use by Sector',
                marryChildren: true,
              },
            ]
          : []),
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          cellRenderer: 'agFloatCellRenderer',
          field: 'imports',
          headerName: 'Import',
          initialWidth: 130,
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          cellRenderer: 'agFloatCellRenderer',
          field: 'exports',
          headerName: 'Export',
          initialWidth: 130,
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          cellRenderer: 'agFloatCellRenderer',
          field: 'production',
          headerName: 'Production',
          initialWidth: 130,
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          cellRenderer: 'agFloatCellRenderer',
          field: 'import_quotas',
          headerName: 'Import Quotas',
          initialWidth: 150,
        },
        {
          cellEditor: 'agDateCellEditor',
          cellRenderer: 'agDateCellRenderer',
          field: 'banned_date',
          headerName: 'Date ban commenced (DD/MM/YYYY)',
          initialWidth: 200,
        },
        {
          cellClass: 'ag-text-left',
          cellEditor: 'agTextCellEditor',
          field: 'remarks',
          headerName: 'Remarks',
          initialWidth: 300,
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: (props: any) => {
          return cx({
            'ag-flex-cell': props.data.rowType === 'control',
            'ag-text-right': !includes(['display_name'], props.colDef.field),
            'bg-gray-100 theme-dark:bg-gray-900/40': includes(
              props.data.excluded_usages || [],
              props.colDef.id,
            ),
            'bg-mui-box-background': includes(
              ['display_name'],
              props.colDef.field,
            ),
          })
        },
        editable: (props) => {
          if (
            includes(['total', 'subtotal'], props.data.rowType) ||
            includes(['display_name'], props.colDef.field) ||
            includes(['total_usages'], props.colDef.id) ||
            includes(props.data.excluded_usages || [], props.colDef.id)
          ) {
            return false
          }
          return true
        },
        headerClass: 'ag-text-center',
        minWidth: 130,
        resizable: true,
        wrapText: true,
      },
    }),
    // eslint-disable-next-line
    [usages, openAddSubstanceModal, onRemoveSubstance],
  )

  return gridOptions
}

export default useGridOptions

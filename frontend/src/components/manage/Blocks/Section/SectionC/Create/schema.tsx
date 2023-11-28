import { useMemo } from 'react'

import { Button, IconButton } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById, defaultColDef } from '@ors/config/Table/columnsDef'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'

import { IoTrash } from 'react-icons/io5'

function useGridOptions(props: {
  onRemoveSubstance: any
  openAddChimicalModal: any
}) {
  const { onRemoveSubstance, openAddChimicalModal } = props

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
                  onClick={openAddChimicalModal}
                >
                  + Add chimical
                </Button>
              )
            }
            return (
              <AgCellRenderer
                {...props}
                value={
                  <>
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
                  </>
                }
              />
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
          ...colDefById['display_name'],
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'previous_year_price',
          headerName: 'Previous year price',
          ...colDefById['previous_year_price'],
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'current_year_price',
          headerName: 'Current prices',
          ...colDefById['current_year_price'],
        },
        {
          cellEditor: 'agTextCellEditor',
          field: 'remarks',
          headerComponentParams: {
            footnote: 1,
            info: true,
          },
          headerName: 'Remarks',
          ...colDefById['remarks'],
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: (props: any) => {
          return cx({
            'ag-flex-cell': props.data.rowType === 'control',
            'ag-text-right': !includes(['display_name'], props.colDef.field),
            'bg-mui-box-background': includes(
              ['display_name'],
              props.colDef.field,
            ),
          })
        },
        editable: (props) => {
          if (
            includes(['total', 'subtotal'], props.data.rowType) ||
            includes(['display_name'], props.colDef.field)
          ) {
            return false
          }
          return true
        },
        headerClass: 'ag-text-center',
        minWidth: defaultColDef.minWidth,
        resizable: true,
        wrapText: true,
      },
    }),
    // eslint-disable-next-line
    [openAddChimicalModal, onRemoveSubstance],
  )

  return gridOptions
}

export default useGridOptions

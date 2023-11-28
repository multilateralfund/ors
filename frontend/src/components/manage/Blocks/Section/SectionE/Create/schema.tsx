import { useMemo } from 'react'

import { Button, IconButton } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById, defaultColDef } from '@ors/config/Table/columnsDef'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'

import { IoTrash } from 'react-icons/io5'

function useGridOptions(props: {
  addFacility: () => void
  removeFacility: (props: any) => void
}) {
  const { addFacility, removeFacility } = props
  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellClass: (props) => {
            return cx('bg-mui-box-background', {
              'ag-flex-cell': props.data.rowType === 'control',
            })
          },
          cellEditor: 'agTextCellEditor',
          cellRenderer: (props: any) => {
            if (props.data.rowType === 'control') {
              return (
                <Button
                  className="w-full"
                  variant="contained"
                  onClick={addFacility}
                >
                  + Add facility
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
                            removeFacility(props)
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
          field: 'facility',
          headerClass: 'ag-text-left',
          headerName: 'Facility name or identifier',
          ...colDefById['facility'],
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'total',
          headerComponentParams: {
            footnote: 1,
            info: true,
          },
          headerName: 'Total amount generated',
          ...colDefById['total_amount_generated'],
        },
        {
          children: [
            {
              aggFunc: 'sumTotal',
              cellEditor: 'agNumberCellEditor',
              dataType: 'number',
              field: 'all_uses',
              headerName: 'For all uses',
              ...colDefById['all_uses'],
            },
            {
              aggFunc: 'sumTotal',
              cellEditor: 'agNumberCellEditor',
              dataType: 'number',
              field: 'feedstock_gc',
              headerName: 'For feedstock use in your country',
              ...colDefById['feedstock_gc'],
            },
            {
              aggFunc: 'sumTotal',
              cellEditor: 'agNumberCellEditor',
              dataType: 'number',
              field: 'destruction',
              headerName: 'For destruction',
              ...colDefById['destruction'],
            },
          ],
          groupId: 'amount_generated_and_captured',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerGroupComponentParams: {
            footnote: 2,
            info: true,
          },
          headerName: 'Amount generated and captured',
          marryChildren: true,
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'feedstock_wpc',
          headerComponentParams: {
            footnote: 3,
            info: true,
          },
          headerName: 'Amount used for feedstock without prior capture',
          ...colDefById['feedstock_wpc'],
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'destruction_wpc',
          headerComponentParams: {
            footnote: 4,
            info: true,
          },
          headerName: 'Amount destroyed without prior capture',
          ...colDefById['destruction_wpc'],
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'generated_emissions',
          headerName: 'Amount of generated emission',
          ...colDefById['generated_emissions'],
        },
        {
          cellEditor: 'agTextCellEditor',
          field: 'remarks',
          headerName: 'Remarks',
          ...colDefById['remarks'],
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: 'ag-text-right',
        editable: (props) =>
          !includes(['total', 'control'], props.data.rowType),
        headerClass: 'ag-text-center',
        minWidth: defaultColDef.minWidth,
        resizable: true,
        wrapText: true,
      },
    }),
    [addFacility, removeFacility],
  )

  return gridOptions
}

export default useGridOptions

import { useMemo } from 'react'

import { Button } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'

function useGridOptions(props: { addFacility: () => void }) {
  const { addFacility } = props
  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellClass: (props) =>
            cx('bg-mui-box-background', {
              'ag-flex-cell': props.data.rowType === 'control',
            }),
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
            return <AgCellRenderer {...props} />
          },
          cellRendererParams: (props: any) => ({
            className: cx({
              'font-bold': includes(['group', 'total'], props.data.rowType),
            }),
          }),
          field: 'facility',
          headerClass: 'ag-text-left',
          headerName: 'Facility name or identifier',
          initialWidth: 400,
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            min: '0',
          },
          cellRenderer: 'agFloatCellRenderer',
          field: 'total',
          headerComponentParams: {
            footnote: 2,
          },
          headerName: 'Total amount generated',
          initialWidth: 240,
        },
        {
          children: [
            {
              aggFunc: 'sumTotal',
              cellEditor: 'agNumberCellEditor',
              cellEditorParams: {
                min: '0',
              },
              cellRenderer: 'agFloatCellRenderer',
              field: 'all_uses',
              headerName: 'For all uses',
            },
            {
              aggFunc: 'sumTotal',
              cellEditor: 'agNumberCellEditor',
              cellEditorParams: {
                min: '0',
              },
              cellRenderer: 'agFloatCellRenderer',
              field: 'feedstock_gc',
              headerName: 'For feedstock use in your country',
            },
            {
              aggFunc: 'sumTotal',
              cellEditor: 'agNumberCellEditor',
              cellEditorParams: {
                min: '0',
              },
              cellRenderer: 'agFloatCellRenderer',
              field: 'destruction',
              headerName: 'For destruction',
            },
          ],
          groupId: 'amount_generated_and_captured',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerGroupComponentParams: {
            footnote: 3,
          },
          headerName: 'Amount generated and captured',
          marryChildren: true,
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            min: '0',
          },
          cellRenderer: 'agFloatCellRenderer',
          field: 'feedstock_wpc',
          headerComponentParams: {
            footnote: 4,
          },
          headerName: 'Amount used for feedstock without prior capture',
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            min: '0',
          },
          cellRenderer: 'agFloatCellRenderer',
          field: 'destruction_wpc',
          headerComponentParams: {
            footnote: 5,
          },
          headerName: 'Amount destroyed without prior capture',
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            min: '0',
          },
          cellRenderer: 'agFloatCellRenderer',
          field: 'generated_emissions',
          headerName: 'Amount of generated emission',
        },
        {
          cellEditor: 'agTextCellEditor',
          field: 'remarks',
          headerName: 'Remarks',
          initialWidth: 300,
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: 'ag-text-right',
        editable: (props) =>
          !includes(['total', 'control'], props.data.rowType),
        headerClass: 'ag-text-center',
        minWidth: 200,
        resizable: true,
        wrapText: true,
      },
    }),
    [addFacility],
  )

  return gridOptions
}

export default useGridOptions

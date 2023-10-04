import { useState } from 'react'

import { Button } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'

import AgTextCellRenderer from '@ors/components/manage/AgCellRenderers/AgTextCellRenderer'

function useGridOptions(props: { setAddModal: (...args: any) => void }) {
  const { setAddModal } = props
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        cellClass: (props: any) => {
          return cx('bg-mui-box-background', {
            'ag-text-center': props.data.isController,
          })
        },
        cellRenderer: (props: any) => {
          if (props.data.isController) {
            return (
              <Button variant="contained" onClick={() => setAddModal(true)}>
                + Add substance
              </Button>
            )
          }
          return <AgTextCellRenderer {...props} />
        },
        cellRendererParams: (props: any) => ({
          className: cx({
            'font-bold': props.data.isGroup || props.data.isTotal,
          }),
        }),
        editable: false,
        field: 'chemical_name',
        headerName: 'Substance',
        width: 200,
      },
      {
        children: [
          {
            id: 1,
            aggFunc: 'sumUsages',
            cellEditor: 'agNumberCellEditor',
            cellEditorParams: {
              min: '0',
            },
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Aerosol',
            minWidth: 100,
          },
          {
            id: 2,
            aggFunc: 'sumUsages',
            cellEditor: 'agNumberCellEditor',
            cellEditorParams: {
              min: '0',
            },
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Foam',
            minWidth: 100,
          },
          {
            id: 3,
            aggFunc: 'sumUsages',
            cellEditor: 'agNumberCellEditor',
            cellEditorParams: {
              min: '0',
            },
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Fire fighting',
            minWidth: 130,
          },
          {
            id: 4,
            children: [
              {
                id: 5,
                aggFunc: 'sumUsages',
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                  min: '0',
                },
                cellRenderer: 'agUsageCellRenderer',
                headerName: 'Manufacturing',
                minWidth: 150,
              },
              {
                id: 9,
                aggFunc: 'sumUsages',
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                  min: '0',
                },
                cellRenderer: 'agUsageCellRenderer',
                headerName: 'Servicing',
                minWidth: 150,
              },
            ],
            groupId: 'usage_refrigeration',
            headerClass: 'ag-text-center',
            headerGroupComponent: 'agColumnHeaderGroup',
            headerName: 'Refrigeration',
            marryChildren: true,
          },
          {
            id: 10,
            aggFunc: 'sumUsages',
            cellEditor: 'agNumberCellEditor',
            cellEditorParams: {
              min: '0',
            },
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Solvent',
            minWidth: 120,
          },
          {
            id: 13,
            aggFunc: 'sumUsages',
            cellEditor: 'agNumberCellEditor',
            cellEditorParams: {
              min: '0',
            },
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Process agent',
            minWidth: 150,
          },
          {
            id: 15,
            aggFunc: 'sumUsages',
            cellEditor: 'agNumberCellEditor',
            cellEditorParams: {
              min: '0',
            },
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Lab use',
            minWidth: 110,
          },
          {
            id: 16,
            children: [
              {
                id: 17,
                aggFunc: 'sumUsages',
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                  min: '0',
                },
                cellRenderer: 'agUsageCellRenderer',
                headerName: 'QPS',
                minWidth: 110,
              },
              {
                id: 18,
                aggFunc: 'sumUsages',
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                  min: '0',
                },
                cellRenderer: 'agUsageCellRenderer',
                headerName: 'Non-QPS',
                minWidth: 110,
              },
            ],
            groupId: 'usage_methyl_bromide',
            headerClass: 'ag-text-center',
            headerGroupComponent: 'agColumnHeaderGroup',
            headerName: 'Methyl bromide',
            marryChildren: true,
          },
          {
            id: 'total',
            aggFunc: 'sumUsages',
            cellClass: (props) =>
              cx({
                'bg-gray-100 theme-dark:bg-gray-900/40':
                  !props.data.isGroup &&
                  !props.data.isSubTotal &&
                  !props.data.isTotal &&
                  !props.data.isController,
              }),
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'TOTAL',
            minWidth: 140,
          },
        ],
        groupId: 'usages',
        headerClass: 'ag-text-center',
        headerGroupComponent: 'agColumnHeaderGroup',
        headerName: 'Use by Sector',
        marryChildren: true,
      },
      {
        aggFunc: 'sum',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          min: '0',
        },
        cellRenderer: 'agFloatCellRenderer',
        field: 'imports',
        headerName: 'Imports',
        minWidth: 100,
      },
      {
        aggFunc: 'sum',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          min: '0',
        },
        cellRenderer: 'agFloatCellRenderer',
        field: 'exports',
        headerName: 'Exports',
        minWidth: 100,
      },
      {
        aggFunc: 'sum',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          min: '0',
        },
        cellRenderer: 'agFloatCellRenderer',
        field: 'production',
        headerName: 'Production',
        minWidth: 120,
      },
      {
        aggFunc: 'sum',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          min: '0',
        },
        cellRenderer: 'agFloatCellRenderer',
        field: 'import_quotas',
        headerName: 'Import Quotas',
        minWidth: 150,
      },
      {
        cellEditor: 'agDateCellEditor',
        cellRenderer: 'agDateCellRenderer',
        field: 'banned_date',
        headerName:
          'If imports are banned, indicate date ban commenced (DD/MM/YYYY)',
        minWidth: 320,
      },
      {
        cellEditor: 'agTextCellEditor',
        cellEditorParams: { label: 'Add remarks' },
        cellEditorPopup: true,
        field: 'remarks',
        headerName: 'Remarks',
        minWidth: 300,
      },
    ],
    defaultColDef: {
      // cellClass: (props) => {
      //   return cx({
      //     disabled:
      //       props.colDef.disabled ||
      //       (props.colDef.type === 'usages' &&
      //         props.data.substance?.excluded_usages?.includes(
      //           props.colDef.id,
      //         )),
      //   })
      // },
      // editable: (props) => {
      //   if (
      //     props.colDef.type === 'usages' &&
      //     props.data.substance?.excluded_usages?.includes(props.colDef.id)
      //   ) {
      //     return false
      //   }
      //   return true
      // },
      editable: (props) => {
        if (
          props.data.isTotal ||
          props.data.isSubTotal ||
          props.data.isGroup ||
          props.colDef.id === 'total'
        ) {
          return false
        }
        return true
      },
      flex: 1,
      minWidth: 140,
      resizable: true,
    },
  })

  return gridOptions
}

export default useGridOptions

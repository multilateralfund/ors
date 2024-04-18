import { useMemo } from 'react'

import { Button } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'
import { NON_EDITABLE_ROWS } from '@ors/config/Table/columnsDef/settings'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'

import { sectionColDefById, sectionColGroupDefById } from '../sectionColumnsDef'

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
                  className="w-full leading-3"
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
              'font-bold': includes(
                ['group', 'total', 'subtotal'],
                props.data.rowType,
              ),
            }),
            options: !props.data.mandatory && !props.data.rowType && (
              <Dropdown.Item
                onClick={() => {
                  removeFacility(props)
                }}
              >
                <div className="flex items-center gap-x-2">
                  <IoTrash className="fill-error" size={20} />
                  <span>Delete</span>
                </div>
              </Dropdown.Item>
            ),
          }),
          field: 'facility',
          headerClass: 'ag-text-left',
          headerName: 'Facility name or identifier',
          ...sectionColDefById['facility'],
        },
        {
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'total',
          headerName: 'Total amount generated',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['total_amount_generated'],
        },
        {
          children: [
            {
              cellEditor: 'agNumberCellEditor',
              dataType: 'number',
              field: 'all_uses',
              headerName: 'For all uses',
              orsAggFunc: 'sumTotal',
              ...sectionColDefById['all_uses'],
            },
            {
              cellEditor: 'agNumberCellEditor',
              dataType: 'number',
              field: 'feedstock_gc',
              headerName: 'For feedstock use in your country',
              orsAggFunc: 'sumTotal',
              ...sectionColDefById['feedstock_gc'],
            },
            {
              cellEditor: 'agNumberCellEditor',
              dataType: 'number',
              field: 'destruction',
              headerName: 'For destruction',
              orsAggFunc: 'sumTotal',
              ...sectionColDefById['destruction'],
            },
          ],
          groupId: 'amount_generated_and_captured',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'Amount generated and captured',
          marryChildren: true,
          ...sectionColGroupDefById['amount_generated_and_captured'],
        },
        {
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'feedstock_wpc',
          headerName: 'Amount used for feedstock without prior capture',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['feedstock_wpc'],
        },
        {
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'destruction_wpc',
          headerName: 'Amount destroyed without prior capture',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['destruction_wpc'],
        },
        {
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'generated_emissions',
          headerName: 'Amount of generated emissions',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['generated_emissions'],
        },
        {
          cellEditor: 'agTextCellEditor',
          field: 'remarks',
          headerName: 'Remarks',
          ...sectionColDefById['remarks'],
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: 'ag-text-right',
        editable: (props) => !includes(NON_EDITABLE_ROWS, props.data.rowType),
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

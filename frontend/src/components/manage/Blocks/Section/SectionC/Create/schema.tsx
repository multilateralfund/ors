import { useMemo } from 'react'

import { Button } from '@mui/material'
import { IoTrash } from '@react-icons/all-files/io5/IoTrash'
import {
  CellClassParams,
  EditableCallbackParams,
  GridOptions,
  ICellRendererParams,
} from 'ag-grid-community'
import { CustomCellRendererProps } from 'ag-grid-react'
import cx from 'classnames'
import { includes } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'
import { NON_EDITABLE_ROWS } from '@ors/config/Table/columnsDef/settings'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'

import { sectionColDefById } from '../sectionColumnsDef'
import { RowData } from './Create'

function useGridOptions(props: {
  model: string
  onRemoveSubstance: (props: ICellRendererParams) => void
  openAddChemicalModal: () => void
}) {
  const { model, onRemoveSubstance, openAddChemicalModal } = props

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellRenderer: (props: CustomCellRendererProps<RowData>) => {
            if (props.data?.rowType === 'control') {
              return (
                <Button
                  className="w-full leading-3"
                  variant="contained"
                  onClick={openAddChemicalModal}
                >
                  + Add chemical
                </Button>
              )
            }
            return <AgCellRenderer {...props} />
          },
          cellRendererParams: (props: ICellRendererParams<RowData>) => ({
            className: cx({
              'font-bold': includes(
                ['group', 'total', 'subtotal'],
                props.data?.rowType,
              ),
            }),
            options: !props.data?.mandatory && !props.data?.rowType && (
              <Dropdown.Item
                onClick={() => {
                  onRemoveSubstance(props)
                }}
              >
                <div className="flex items-center gap-x-2">
                  <IoTrash className="fill-error" size={20} />
                  <span>Delete</span>
                </div>
              </Dropdown.Item>
            ),
          }),
          field: 'display_name',
          headerClass: 'ag-text-left',
          headerName: includes(['IV'], model) ? 'Description' : 'Substance',
          ...sectionColDefById['display_name'],
        },
        ...(!includes(['II', 'III'], model)
          ? [
              {
                cellEditor: 'agNumberCellEditor',
                dataType: 'number',
                field: 'previous_year_price',
                headerName: 'Previous year price',
                orsAggFunc: 'sumTotal',
                ...sectionColDefById['previous_year_price'],
              },
            ]
          : []),
        {
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'current_year_price',
          headerName: 'Current prices',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['current_year_price'],
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
        cellClass: (props: CellClassParams<RowData>) => {
          return cx({
            'ag-flex-cell': props.data?.rowType === 'control',
            'ag-text-right': !includes(['display_name'], props.colDef.field),
          })
        },
        editable: (props: EditableCallbackParams<RowData>) => {
          if (
            includes(NON_EDITABLE_ROWS, props.data?.rowType) ||
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
    [openAddChemicalModal, onRemoveSubstance],
  )

  return gridOptions
}

export default useGridOptions

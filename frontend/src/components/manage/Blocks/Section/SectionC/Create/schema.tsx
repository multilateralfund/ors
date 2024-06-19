import type { RowData } from './types'

import { useMemo } from 'react'

import { Button } from '@mui/material'
import {
  CellClassParams,
  EditableCallbackParams,
  GridOptions,
  ICellRendererParams,
} from 'ag-grid-community'
import { CustomCellRendererProps } from 'ag-grid-react'
import cx from 'classnames'
import { includes } from 'lodash'

import { NON_EDITABLE_ROWS } from '@ors/config/Table/columnsDef/settings'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'

import { sectionColDefByIdFunc } from '../sectionColumnsDef'

import { IoTrash } from 'react-icons/io5'

function useGridOptions(props: {
  model: string
  onRemoveSubstance: (props: ICellRendererParams) => void
  openAddChemicalModal: () => void
}) {
  const { model, onRemoveSubstance, openAddChemicalModal } = props
  const sectionColDefById = sectionColDefByIdFunc(model)

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
            ...sectionColDefById['display_name'],
            className: cx({
              'font-bold': includes(
                ['group', 'total', 'subtotal'],
                props.data?.rowType,
              ),
            }),
            options: !props.data?.mandatory && !props.data?.rowType && (
              <IoTrash
                className="cursor-pointer fill-error"
                size={16}
                onClick={() => {
                  onRemoveSubstance(props)
                }}
              />
            ),
          }),
          field: 'display_name',
          headerClass: 'ag-text-left',
          headerName: includes(['IV'], model) ? 'Description' : 'Substance',
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
        // minWidth: defaultColDef.minWidth,
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

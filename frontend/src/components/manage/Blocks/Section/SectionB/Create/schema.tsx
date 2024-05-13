import type { RowData } from './types'
import { EmptyFormUsageColumn } from '@ors/types/api_empty-form'

import { useMemo } from 'react'

import { Button, Link } from '@mui/material'
import {
  CellClassParams,
  EditableCallbackParams,
  GridOptions,
  ICellRendererParams,
} from 'ag-grid-community'
import { CustomCellRendererProps } from 'ag-grid-react'
import cx from 'classnames'
import { includes, omit } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'
import { NON_EDITABLE_ROWS } from '@ors/config/Table/columnsDef/settings'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'

import { sectionColDefById } from '../sectionColumnsDef'

import { IoTrash } from 'react-icons/io5'

function useGridOptions(props: {
  model: string
  onRemoveSubstance: (props: ICellRendererParams) => void
  openAddChemicalModal: () => void
  usages: EmptyFormUsageColumn[]
}) {
  const { model, onRemoveSubstance, openAddChemicalModal, usages } = props

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          ...sectionColDefById['display_name'],
          cellRenderer: (props: CustomCellRendererProps) => {
            if (props.data.row_id === 'control-add_chemical') {
              return (
                <Button
                  className="w-full leading-3"
                  variant="contained"
                  onClick={openAddChemicalModal}
                >
                  Add blend
                </Button>
              )
            } else if (props.data.row_id === 'other-new_substance') {
              const renderValue = (
                <Link
                  className="cursor-pointer"
                  color={'inherit'}
                  underline="hover"
                  onClick={openAddChemicalModal}
                >
                  <span>Other</span>
                </Link>
              )
              return (
                <AgCellRenderer
                  {...omit(props, ['value'])}
                  value={renderValue}
                />
              )
            }
            return sectionColDefById['display_name'].cellRenderer(props)
          },
          cellRendererParams: (props: ICellRendererParams<RowData>) => {
            return {
              ...sectionColDefById['display_name'].cellRendererParams(props),
              options: !props.data?.mandatory && !props.data?.rowType && (
                <IoTrash
                  className="cursor-pointer fill-error"
                  size={16}
                  onClick={() => {
                    onRemoveSubstance(props)
                  }}
                />
              ),
            }
          },
          field: 'display_name',
          headerClass: 'ag-text-left',
          headerName: includes(['IV'], model) ? '' : 'Substance',
        },
        ...(usages.length
          ? [
              {
                children: [
                  ...usages,
                  {
                    id: 'total_usages',
                    category: 'usage',
                    cellClass: 'bg-yellow-50 text-center',
                    field: 'total_usages',
                    headerName: 'TOTAL',
                    orsAggFunc: 'sumTotalUsages',
                    ...sectionColDefById['total_usages'],
                  },
                ],
                headerGroupComponent: 'agColumnHeaderGroup',
                headerName: 'Use by Sector',
                marryChildren: true,
              },
            ]
          : []),
        {
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'imports',
          headerName: 'Import',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['imports'],
        },
        {
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'exports',
          headerName: 'Export',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['exports'],
        },
        {
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'production',
          headerName: 'Production',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['production'],
        },
        ...(includes(['V'], model)
          ? [
              {
                dataType: 'number',
                field: 'manufacturing_blends',
                headerName: 'Manufacturing of Blends',
                orsAggFunc: 'sumTotal',
                ...sectionColDefById['manufacturing_blends'],
              },
            ]
          : []),
        ...(includes(['II', 'III', 'IV', 'V'], model)
          ? [
              {
                cellEditor: 'agNumberCellEditor',
                dataType: 'number',
                field: 'import_quotas',
                headerName: 'Import Quotas',
                orsAggFunc: 'sumTotal',
                ...sectionColDefById['import_quotas'],
              },
            ]
          : []),
        {
          cellEditor: 'agDateCellEditor',
          dataType: 'date',
          field: 'banned_date',
          ...sectionColDefById['banned_date'],
        },
        {
          cellClass: 'ag-text-left',
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
            'ag-cell-hashed theme-dark:bg-gray-900/40':
              includes(props.data?.excluded_usages || [], props.colDef.id) ||
              (props.column.getColId() === 'manufacturing_blends' &&
                includes(['V'], model) &&
                props.data?.substance_id) ||
              (props.column.getColId() === 'production' &&
                includes(['V'], model) &&
                props.data?.blend_id),
            'ag-flex-cell': props.data?.rowType === 'control',
            'ag-text-center': !includes(['display_name'], props.colDef.field),
          })
        },
        editable: (props: EditableCallbackParams<RowData>) => {
          if (
            includes(NON_EDITABLE_ROWS, props.data?.rowType) ||
            includes(['display_name'], props.colDef.field) ||
            includes(['total_usages'], props.colDef.id) ||
            includes(props.data?.excluded_usages || [], props.colDef.id) ||
            (props.column.getColId() === 'manufacturing_blends' &&
              includes(['V'], model) &&
              props.data?.substance_id) ||
            (props.column.getColId() === 'production' &&
              includes(['V'], model) &&
              props.data?.blend_id)
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
    [usages, openAddChemicalModal, onRemoveSubstance],
  )

  return gridOptions
}

export default useGridOptions

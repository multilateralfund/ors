import { useMemo } from 'react'

import { Button, Link, Tooltip } from '@mui/material'
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
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'

import { sectionColDefById } from '../sectionColumnsDef'
import { RowData } from './Create'

import { IoTrash } from 'react-icons/io5'

function useGridOptions(props: {
  model: string
  onRemoveSubstance: any
  openAddSubstanceModal: any
  usages: any
}) {
  const { model, onRemoveSubstance, openAddSubstanceModal, usages } = props

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellRenderer: (props: CustomCellRendererProps<RowData>) => {
            if (
              props.data?.rowType === 'control' &&
              props.data?.row_id === 'control'
            ) {
              return (
                <Tooltip
                  placement="top"
                  title="Indicate relevant controlled substances"
                >
                  <Button
                    className="w-full leading-3"
                    variant="contained"
                    onClick={openAddSubstanceModal}
                  >
                    <span>+ Add substance</span>
                  </Button>
                </Tooltip>
              )
            } else if (props.data?.row_id === 'other-new_substance') {
              const renderValue = (
                <Tooltip
                  placement="top"
                  title="Indicate relevant controlled substances"
                >
                  <Link
                    className="cursor-pointer"
                    color={'inherit'}
                    underline="hover"
                    onClick={openAddSubstanceModal}
                  >
                    <span>Other</span>
                  </Link>
                </Tooltip>
              )
              return (
                <AgCellRenderer
                  {...omit(props, ['value'])}
                  value={renderValue}
                />
              )
            }

            return <AgCellRenderer {...props} />
          },
          cellRendererParams: (props: ICellRendererParams<RowData>) => ({
            ...sectionColDefById['display_name'].cellRendererParams(props),
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
          headerName: 'Substance',
          ...sectionColDefById['display_name'],
        },
        ...(usages.length
          ? [
              {
                children: [
                  ...usages,
                  {
                    id: 'total_usages',
                    category: 'usage',
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
        ...(includes(['II', 'III'], model)
          ? [
              {
                cellEditor: 'agNumberCellEditor',
                dataType: 'number',
                field: 'export_quotas',
                headerName: 'Export Quotas',
                orsAggFunc: 'sumTotal',
                ...sectionColDefById['export_quotas'],
              },
            ]
          : []),
        {
          cellEditor: 'agDateCellEditor',
          dataType: 'date',
          field: 'banned_date',
          headerName: 'If imports are banned, indicate date ban commenced',
          ...sectionColDefById['banned_date'],
        },
        {
          cellClass: 'ag-text-left',
          cellEditor: 'agTextCellEditor',
          field: 'remarks',
          headerName: 'Remarks',
          ...sectionColDefById['remarks'],
          headerComponentParams: {
            ...sectionColDefById['remarks'].headerComponentParams,
            footnote: {
              ...sectionColDefById['remarks'].headerComponentParams.footnote,
              id: '3',
            },
          },
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: (props: CellClassParams<RowData>) => {
          return cx({
            'ag-flex-cell': props.data?.rowType === 'control',
            'ag-text-right': !includes(['display_name'], props.colDef.field),
            'bg-gray-100 theme-dark:bg-gray-900/40': includes(
              props.data?.excluded_usages || [],
              props.colDef.id,
            ),
            'bg-mui-box-background': includes(
              ['display_name'],
              props.colDef.field,
            ),
          })
        },
        editable: (props: EditableCallbackParams<RowData>) => {
          if (
            includes(NON_EDITABLE_ROWS, props.data?.rowType) ||
            includes(['display_name'], props.colDef.field) ||
            includes(['total_usages'], props.colDef.id) ||
            includes(props.data?.excluded_usages || [], props.colDef.id)
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
    [usages, openAddSubstanceModal, onRemoveSubstance],
  )

  return gridOptions
}

export default useGridOptions

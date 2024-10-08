import type { SectionARowData } from '../types'

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

import { NON_EDITABLE_ROWS } from '@ors/config/Table/columnsDef/settings'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'

import { sectionColDefByIdFunc } from '../sectionColumnsDef'

import { IoTrash } from 'react-icons/io5'

function useGridOptions(props: {
  model: string
  onRemoveSubstance: any
  openAddSubstanceModal: any
  usages: any
}) {
  const { model, onRemoveSubstance, openAddSubstanceModal, usages } = props

  const sectionColDefById = sectionColDefByIdFunc(model)

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          ...sectionColDefById['display_name'],
          cellRenderer: (props: CustomCellRendererProps<SectionARowData>) => {
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
          cellRendererParams: (
            props: ICellRendererParams<SectionARowData>,
          ) => ({
            ...sectionColDefById['display_name'].cellRendererParams(props),
            options: !props.data?.mandatory && !props.data?.rowType && (
              <IoTrash
                className="cursor-pointer fill-mlfs-purple"
                size={16}
                onClick={() => {
                  onRemoveSubstance(props)
                }}
              />
            ),
          }),
          field: 'display_name',
          flex: 2,
          headerClass: 'ag-text-left',
          headerName: 'Substance',
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
        ...(includes(['IV', 'V'], model)
          ? [
              {
                cellEditor: 'agDateCellEditor',
                dataType: 'date',
                field: 'banned_date',
                ...sectionColDefById['banned_date'],
              },
            ]
          : []),
        ...(includes(['II', 'III', 'IV', 'V'], model)
          ? [
              {
                cellEditor: 'agTextCellEditor',
                field: 'remarks',
                headerName: 'Remarks',
                ...sectionColDefById['remarks'],
                headerComponentParams: {
                  ...sectionColDefById['remarks'].headerComponentParams,
                  footnote: {
                    ...sectionColDefById['remarks'].headerComponentParams
                      .footnote,
                  },
                },
              },
            ]
          : []),
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: (props: CellClassParams<SectionARowData>) => {
          return cx({
            'ag-cell-hashed theme-dark:bg-gray-900/40': includes(
              props.data?.excluded_usages || [],
              props.colDef.id,
            ),
            'ag-flex-cell': props.data?.rowType === 'control',
            'ag-text-center': !includes(['display_name'], props.colDef.field),
          })
        },
        editable: (props: EditableCallbackParams<SectionARowData>) => {
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
        // minWidth: defaultColDef.minWidth,
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

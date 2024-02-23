import { useMemo } from 'react'

import { Button, Link } from '@mui/material'
import { GridOptions, ICellRendererParams } from 'ag-grid-community'
import cx from 'classnames'
import { includes, omit } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'

import { sectionColDefById } from '../sectionColumnsDef'

import { IoTrash } from 'react-icons/io5'

function useGridOptions(props: {
  model: string
  onRemoveSubstance: (props: ICellRendererParams) => void
  openAddChemicalModal: () => void
  openCreateBlendModal: () => void
  usages: any
}) {
  const {
    model,
    onRemoveSubstance,
    openAddChemicalModal,
    openCreateBlendModal,
    usages,
  } = props

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          ...sectionColDefById['display_name'],
          cellRenderer: (props: any) => {
            if (props.data.row_id === 'control-add_chemical') {
              return (
                <Button
                  className="w-full leading-3"
                  variant="contained"
                  onClick={openAddChemicalModal}
                >
                  + Add chemical
                </Button>
              )
            } else if (props.data.row_id === 'control-add_blend') {
              return (
                <Button
                  className="w-full leading-3"
                  variant="contained"
                  onClick={openCreateBlendModal}
                >
                  Create blend
                </Button>
              )
            }
            else if (props.data.row_id === 'other-new_substance') {
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
                  {...omit(props, ['value', 'footnote'])}
                  value={renderValue}
                  footnote={{
                    id: '2',
                    content: 'If a non-standard blend not listed in the above table is used, please indicate the percentage of each constituent controlled substance of the blend being reported in the remarks column.',
                    icon: true,
                    order: 2,
                  }}
                />
              )
            }
            return <AgCellRenderer {...props} />
          },
          cellRendererParams: (props: ICellRendererParams) => ({
            ...sectionColDefById['display_name'].cellRendererParams(props),
            options: !props.data.mandatory && !props.data.rowType && (
              <>
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
              </>
            ),
          }),
          field: 'display_name',
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
                    aggFunc: 'sumTotalUsages',
                    category: 'usage',
                    field: 'total_usages',
                    headerName: 'TOTAL',
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
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'imports',
          headerName: 'Import',
          ...sectionColDefById['imports'],
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'exports',
          headerName: 'Export',
          ...sectionColDefById['exports'],
        },
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'production',
          headerName: 'Production',
          ...sectionColDefById['production'],
        },
        ...(includes(['V'], model)
          ? [
              {
                aggFunc: 'sumTotal',
                dataType: 'number',
                field: 'manufacturing_blends',
                headerName: 'Manufacturing of Blends',
                ...sectionColDefById['manufacturing_blends'],
              },
            ]
          : []),
        {
          aggFunc: 'sumTotal',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'import_quotas',
          headerName: 'Import Quotas',
          ...sectionColDefById['import_quotas'],
        },
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
              id: '4',
              order: 4,
            },
          },
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: (props: any) => {
          return cx({
            'ag-flex-cell': props.data.rowType === 'control',
            'ag-text-right': !includes(['display_name'], props.colDef.field),
            'bg-gray-100 theme-dark:bg-gray-900/40': includes(
              props.data.excluded_usages || [],
              props.colDef.id,
            ),
            'bg-mui-box-background': includes(
              ['display_name'],
              props.colDef.field,
            ),
          })
        },
        editable: (props) => {
          if (
            includes(['total', 'subtotal'], props.data.rowType) ||
            includes(['display_name'], props.colDef.field) ||
            includes(['total_usages'], props.colDef.id) ||
            includes(props.data.excluded_usages || [], props.colDef.id)
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

import { useMemo } from 'react'

import { Button } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'

import { sectionColDefById } from '../sectionColumnsDef'

import { IoTrash } from 'react-icons/io5'

function useGridOptions(props: {
  model: string
  onRemoveSubstance: any
  openAddChimicalModal: any
  usages: any
}) {
  const { model, onRemoveSubstance, openAddChimicalModal, usages } = props

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          ...sectionColDefById['display_name'],
          cellRenderer: (props: any) => {
            if (props.data.rowType === 'control') {
              return (
                <Button
                  className="w-full"
                  variant="contained"
                  onClick={openAddChimicalModal}
                >
                  + Add chimical
                </Button>
              )
            }
            return <AgCellRenderer {...props} />
          },
          cellRendererParams: (props: any) => ({
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
          headerName: 'Date ban commenced (DD/MM/YYYY)',
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
    [usages, openAddChimicalModal, onRemoveSubstance],
  )

  return gridOptions
}

export default useGridOptions

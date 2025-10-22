import { useContext, useMemo } from 'react'

import { Button } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { NON_EDITABLE_ROWS } from '@ors/config/Table/columnsDef/settings'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import CellValidationAlert from '@ors/components/manage/AgWidgets/CellValidationWidget/CellValidationAlert'
import ValidationContext from '@ors/contexts/Validation/ValidationContext'
import { ValidationSchemaKeys } from '@ors/contexts/Validation/types'

import {
  sectionColDefByIdFunc,
  sectionColGroupDefByIdFunc,
} from '../sectionColumnsDef'

import { IoTrash } from 'react-icons/io5'
import { shouldEnableNewCPDataFormatting } from '@ors/components/manage/Utils/utilFunctions.ts'

function FacilityCellRenderer({ addFacility, ...props }: any) {
  const validation =
    useContext(ValidationContext)?.errors[
      props.context?.section.id as ValidationSchemaKeys
    ]

  const errors = validation?.global.filter((err) =>
    (err?.highlight || []).includes('+ Add facility'),
  )
  if (props.data.rowType === 'control') {
    return (
      <Button
        className="relative w-full leading-3"
        variant="contained"
        onClick={addFacility}
      >
        + Add facility
        {errors?.length ? (
          <div className="absolute right-0">
            <CellValidationAlert errors={errors} />
          </div>
        ) : null}
      </Button>
    )
  }
  return <AgCellRenderer {...props} />
}

function useGridOptions(props: {
  addFacility: () => void
  removeFacility: (props: any) => void
  model: string
}) {
  const { addFacility, removeFacility, model } = props
  const sectionColDefById = sectionColDefByIdFunc(model)
  const sectionColGroupDefById = sectionColGroupDefByIdFunc(model)
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
          cellRenderer: (props: any) => (
            <FacilityCellRenderer {...props} addFacility={addFacility} />
          ),
          cellRendererParams: (props: any) => ({
            className: cx({
              'font-bold': includes(
                ['group', 'total', 'subtotal'],
                props.data.rowType,
              ),
            }),
            options: !props.data.mandatory && !props.data.rowType && (
              <IoTrash
                className="cursor-pointer fill-mlfs-purple"
                size={16}
                onClick={() => {
                  removeFacility(props)
                }}
              />
            ),
          }),
          field: 'facility',
          headerClass: 'ag-text-left',
          headerName: 'Facility name or identifier',
          ...sectionColDefById['facility'],
        },
        {
          cellDataType: 'number',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'total',
          headerName: shouldEnableNewCPDataFormatting(model)
            ? 'Total amount generated (tonnes)'
            : 'Total amount generated',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['total_amount_generated'],
        },
        ...(shouldEnableNewCPDataFormatting(model)
          ? [
              {
                cellDataType: 'number',
                cellEditor: 'agNumberCellEditor',
                dataType: 'number',
                field: 'stored_at_start_of_year',
                headerName:
                  'Amount stored at the beginning of the year (tonnes)',
                orsAggFunc: 'sumTotal',
                ...sectionColDefById['stored_at_end_of_year'],
              },
            ]
          : []),
        {
          children: [
            {
              cellDataType: 'number',
              cellEditor: 'agNumberCellEditor',
              dataType: 'number',
              field: 'all_uses',
              headerName: shouldEnableNewCPDataFormatting(model)
                ? 'For uses excluding feedstocks'
                : 'For all uses',
              orsAggFunc: 'sumTotal',
              ...sectionColDefById['all_uses'],
            },
            {
              cellDataType: 'number',
              cellEditor: 'agNumberCellEditor',
              dataType: 'number',
              field: 'feedstock_gc',
              headerName: 'For feedstock use in your country',
              orsAggFunc: 'sumTotal',
              ...sectionColDefById['feedstock_gc'],
            },
            {
              cellDataType: 'number',
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
          headerName: shouldEnableNewCPDataFormatting(model)
            ? 'Amount generated and captured (tonnes)'
            : 'Amount generated and captured',
          marryChildren: true,
          ...sectionColGroupDefById['amount_generated_and_captured'],
        },
        {
          cellDataType: 'number',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'feedstock_wpc',
          headerName: shouldEnableNewCPDataFormatting(model)
            ? 'Amount used for feedstock without prior capture (tonnes)'
            : 'Amount used for feedstock without prior capture',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['feedstock_wpc'],
        },
        {
          cellDataType: 'number',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'destruction_wpc',
          headerName: shouldEnableNewCPDataFormatting(model)
            ? 'Amount destroyed in the facility without prior capture (tonnes)'
            : 'Amount destroyed without prior capture',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['destruction_wpc'],
        },
        {
          cellDataType: 'number',
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'generated_emissions',
          headerName: shouldEnableNewCPDataFormatting(model)
            ? 'Amount of generated emissions (tonnes)'
            : 'Amount of generated emissions',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['generated_emissions'],
        },
        ...(shouldEnableNewCPDataFormatting(model)
          ? [
              {
                cellDataType: 'number',
                cellEditor: 'agNumberCellEditor',
                dataType: 'number',
                field: 'stored_at_end_of_year',
                headerName: 'Amount stored at the end of the year (tonnes)',
                orsAggFunc: 'sumTotal',
                ...sectionColDefById['stored_at_end_of_year'],
              },
            ]
          : []),
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
        // minWidth: defaultColDef.minWidth,
        resizable: true,
        wrapText: true,
      },
    }),
    [addFacility, removeFacility],
  )

  return gridOptions
}

export default useGridOptions

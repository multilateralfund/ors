/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { Typography } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import dayjs from 'dayjs'

import CellAutocompleteWidget from '@ors/components/manage/Widgets/CellAutocompleteWidget'
import CellDateWidget from '@ors/components/manage/Widgets/CellDateWidget'
import CellNumberWidget from '@ors/components/manage/Widgets/CellNumberWidget'
import CellTextareaWidget from '@ors/components/manage/Widgets/CellTextareaWidget'

export const gridOptions: GridOptions = {
  columnDefs: [
    {
      cellEditor: CellAutocompleteWidget,
      cellEditorParams: {
        options: [
          { id: 0, label: 'Select substance' },
          { id: 1, label: 'H2O' },
          { id: 2, label: 'CO2' },
        ],
      },
      cellRenderer: (props: any) => {
        return <Typography component="span">{props.value.label}</Typography>
      },
      field: 'substance',
      headerName: 'Substance',
    },
    {
      children: [
        { field: 'aerosol', headerName: 'Aerosol' },
        { field: 'foam', headerName: 'Foam' },
        { field: 'fire_fighting', headerName: 'Fire Fighting' },
        {
          children: [
            { field: 'manufacturing', headerName: 'Manufacturing' },
            { field: 'servicing', headerName: 'Servicing' },
          ],
          headerClass: 'text-center',
          headerName: 'Refrigeration',
          marryChildren: true,
        },
      ],
      headerClass: 'text-center',
      headerName: 'Use by Sector',
      marryChildren: true,
    },
    {
      editable: false,
      field: 'country',
      headerName: 'TOTAL',
      valueGetter: 'data.imports + data.exports',
    },
    {
      cellEditor: CellNumberWidget,
      cellEditorParams: {
        min: '0',
      },
      field: 'imports',
      headerName: 'Imports',
    },
    {
      cellEditor: CellNumberWidget,
      cellEditorParams: {
        min: '0',
      },
      field: 'exports',
      headerName: 'Exports',
    },
    {
      cellEditor: CellNumberWidget,
      cellEditorParams: {
        min: '0',
      },
      field: 'production',
      headerName: 'Production',
    },
    {
      cellEditor: CellNumberWidget,
      cellEditorParams: {
        min: '0',
      },
      field: 'import_quotas',
      headerName: 'Import Quotas',
    },
    {
      cellEditor: CellDateWidget,
      cellRenderer: (props: any) => {
        return (
          !!props.value && (
            <Typography component="span">
              {dayjs(props.value).format('DD/MM/YYYY')}
            </Typography>
          )
        )
      },
      field: 'banned_date',
      headerName:
        'If imports are banned, indicate date ban commenced (DD/MM/YYYY)',
    },
    {
      cellEditor: CellTextareaWidget,
      cellEditorPopup: true,
      field: 'remarks',
      headerName: 'Remarks',
    },
  ],
  defaultColDef: { editable: true, flex: 1, minWidth: 200, resizable: true },
}

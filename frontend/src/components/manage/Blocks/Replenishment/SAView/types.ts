import { Country } from '@ors/types/store'

import { HTMLAttributes } from 'react'

import {
  TableCellProps,
  TableColumn,
  TableProps,
  TableRow,
} from '../Table/types'

export interface SATableColumn extends TableColumn {
  confirmationText?: string
  editOptions?: { label: 'No' | 'Yes'; value: 'false' | 'true' }[]
  editParser?: <T>(value: T) => string
  editWidget?: 'select' | string
  editable?: boolean
  parser?: <In, Out>(value: In) => Out
  subLabel?: string
  validator?: <T>(value: T) => string | void
}

export interface SATableCellProps
  extends Omit<
    TableCellProps,
    'adminButtons' | 'columns' | 'onDelete' | 'onEdit'
  > {
  columns: SATableColumn[]
  onCellEdit?: (
    rowIndex: number,
    colIndex: number,
    fname: string,
    value: any,
  ) => void
  onCellRevert?: (rowIndex: number, fname: string) => void
  onDelete?: (rowIndex: number) => void
  rowData: TableRow[]
}

export interface SATableAdminButtonsProps {
  onDelete: () => void
}

export interface AddRowProps {
  columns: SATableColumn[]
  countries: Country[]
  onCancel: () => void
  onSubmit: (country: Country) => void
}

export interface ViewFieldProps {
  cell: any
  onRevert: () => void
}

export interface EditFieldProps extends HTMLAttributes<HTMLElement> {
  column: SATableColumn
  value: any
}

export interface SATableProps
  extends SATableCellProps,
    Omit<TableProps, 'columns' | 'onDelete'> {
  countriesForAdd: Country[]
  enableEdit?: boolean
  onAddCancel: AddRowProps['onCancel']
  onAddSubmit: AddRowProps['onSubmit']
  showAdd?: boolean
}

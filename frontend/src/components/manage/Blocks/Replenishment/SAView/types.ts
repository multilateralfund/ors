import { Country } from '@ors/types/store'

import {
  TableCellProps,
  TableColumn,
  TableProps,
  TableRow,
} from '../Table/types'

export interface SATableColumn extends TableColumn {
  confirmationText?: string
  editable?: boolean
  parser?: <In, Out>(value: In) => Out
  subLabel?: string
  validator?: <T>(value: T) => string | void
}

export interface SATableCellProps
  extends Omit<TableCellProps, 'adminButtons' | 'columns' | 'onEdit'> {
  columns: SATableColumn[]
  onCellEdit?: (
    rowIndex: number,
    colIndex: number,
    fname: string,
    value: any,
  ) => void
  onCellRevert?: (rowIndex: number, fname: string) => void
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

export interface SATableProps
  extends SATableCellProps,
    Omit<TableProps, 'columns'> {
  countriesForAdd: Country[]
  enableEdit?: boolean
  onAddCancel: AddRowProps['onCancel']
  onAddSubmit: AddRowProps['onSubmit']
  showAdd?: boolean
}

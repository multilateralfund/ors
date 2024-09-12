export interface TableColumn {
  className?: string
  field: string
  label: JSX.Element | string
}

export interface TableHeaderCellsProps {
  columns: TableColumn[]
  enableSort: boolean
  onSort: (columnIndex: number) => void
  sortDirection: SortDirection
  sortOn: number
  sortableColumns?: number[]
}

export interface TableRow {
  [key: string]: any
}

export interface TableCellProps {
  adminButtons?: boolean
  c: number
  columns: TableColumn[]
  enableEdit?: boolean
  onDelete?: (rowIndex: number, rowData: TableRow) => void
  onEdit?: (rowIndex: number) => void
  r: number
  rowData: TableRow
  textPosition?: string
}

export interface AdminButtonsProps {
  onDelete?: () => void
  onEdit?: () => void
}

export interface TableProps
  extends TableHeaderCellsProps,
    Pick<
      TableCellProps,
      'adminButtons' | 'onDelete' | 'onEdit' | 'textPosition'
    > {
  adminButtons: boolean
  className?: string

  extraRows?: TableRow[]
  rowData: TableRow[]
}

export type SortDirection = -1 | 1

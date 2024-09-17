import type { CPContext } from '@ors/components/manage/Blocks/CountryProgramme/types'

export type RowClassRule = [string, (props: { data: SimpleRow }) => boolean]

export type SimpleRow = {
  [key: string]: any
  rowType: string
}

export interface EditContext {
  colDef: SimpleColDef
  iCol: number
  iRow: number
}

export interface CellApi {
  applyTransaction: () => void
  flashCells: () => void
  forEachNode: <T = SimpleRow>(callback: (param: { data: T }) => void) => void
  getRowNode: <T = SimpleRow>(row_id: number) => T | null
}

export interface Col {
  colId: number | string
  getColId: () => number | string
}

export interface CellProps {
  api: CellApi
  colDef: SimpleColDef
  column: Col
  context: CPContext
  data: SimpleRow
}

export interface TableCellProps {
  cellProps: CellProps
  colDef: SimpleColDef
  edit: boolean | null
  iCol: number
  iRow: number
  onStartEdit: (iRow: number, iCol: number) => void
  onStopEdit: (value: null | number | string, context: EditContext) => void
}

export interface SimpleColDef {
  cellClass: ((cellProps: CellProps) => string) | string
  cellEditor: string
  cellRendererParams: (cellProps: CellProps) => any
  children: SimpleColDef[]
  editable?: ((cellProps: CellProps) => boolean) | boolean
  field: string
  headerComponentParams:
    | ((cellProps: CellProps, optional?: { context: CPContext }) => string)
    | Record<string, any>
  headerName: string
  id: number
}

export interface HeaderProps {
  context: CPContext
  rows: any[]
}

export interface SimpleTableProps {
  Toolbar: React.FC<any>
  columnDefs: Record<string, any>[] | any
  context: CPContext
  defaultColDef: Record<string, any>[] | any
  editable: boolean
  onEdit: (value: null | number | string, context: EditContext) => void
  rowData: SimpleRow[]
}

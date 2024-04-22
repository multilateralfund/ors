import type { AgGridReactProps } from 'ag-grid-react'

export interface ITableProps extends AgGridReactProps {
  Toolbar?: React.FC<any>
  enableFullScreen?: boolean
  errors?: any
  fadeInOut?: boolean
  headerDepth?: number
  paginationPageSizeSelector?: Array<number>
  rowsVisible?: number
  withFluidEmptyColumn?: boolean
}

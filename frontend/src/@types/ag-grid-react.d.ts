import type {
  ColDef as AgColDef,
  AgGridReactProps as BaseAgGridReactProps,
} from 'ag-grid-community'
import type { MutableRefObject } from 'react'

declare module 'ag-grid-community' {
  interface ColDef extends AgColDef {
    category?: string
    dataType?: string
    disabled?: boolean
    error?: ((props: any) => void) | string
    id?: number | string
    showRowError?: boolean
    type?: string
  }
}

declare module 'ag-grid-react' {
  interface AgGridReactProps
    extends Omit<BaseAgGridReactProps, 'onPaginationChanged'> {
    enablePagination?: boolean
    gridRef?: MutableRefObject<any>
    loading?: boolean
    onPaginationChanged?: ({
      page,
      rowsPerPage,
    }: {
      page: number
      rowsPerPage: number
    }) => void
    rowCount?: number
    rowData?: Array<any> | null
    withMenu?: boolean
    withSeparators?: boolean
    withSkeleton?: boolean
  }
}

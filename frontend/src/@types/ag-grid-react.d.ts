import type {
  ColDef as AgColDef,
  AgGridReactProps as BaseAgGridReactProps,
} from 'ag-grid-community'
import type { CustomCellRendererProps as BaseCustomCellRendererProps } from 'ag-grid-react'
import type { MutableRefObject } from 'react'

declare module 'ag-grid-community' {
  interface ColDef extends AgColDef {
    category?: string
    dataType?: string
    disabled?: boolean
    error?: ((props: any) => void) | string
    id?: number | string
    showRowError?: boolean
    tooltip?: boolean
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

  interface CustomCellRendererProps extends BaseCustomCellRendererProps {
    aggFunc?: string
    className: string
    footnote: {
      content: string
      icon: boolean
      id: string
      index: string
      order: number
    }
    maximumFractionDigits?: number
    minimumFractionDigits?: number
    noText?: string
    yesText?: string
  }
}

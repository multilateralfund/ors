import type {
  ColDef as AgColDef,
  AgGridReactProps as BaseAgGridReactProps,
} from 'ag-grid-community'
import type { CustomCellRendererProps as AgCustomCellRendererProps } from 'ag-grid-react'
import type { MutableRefObject } from 'react'

declare module 'ag-grid-community' {
  interface ColDef extends AgColDef {
    category?: string
    dataType?: string
    disabled?: boolean
    error?: ((props: any) => void) | string
    headerGroupComponentParams?: AgColDef['headerGroupComponentParams']
    id?: number | string
    orsAggFunc?: string
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

  interface CustomCellRendererProps extends AgCustomCellRendererProps {
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

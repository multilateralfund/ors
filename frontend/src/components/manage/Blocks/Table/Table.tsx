'use client'
import type { I18nSlice } from '@ors/slices/createI18nSlice'
import type { ThemeSlice } from '@ors/slices/createThemeSlice'

import { forwardRef, useMemo, useRef, useState } from 'react'

import { Skeleton, TablePagination, Typography } from '@mui/material'
import { ColDef } from 'ag-grid-community'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import cx from 'classnames'
import { times } from 'lodash'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import Loading from '@ors/components/theme/Loading/Loading'
import useStore from '@ors/store'

type TableProps = {
  enablePagination?: boolean
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
  withSkeleton?: boolean
} & Omit<AgGridReactProps, 'onPaginationChanged'>

function Table(
  {
    defaultColDef = {},
    enablePagination = true,
    loading = false,
    onFirstDataRendered = () => {},
    onPaginationChanged = () => {},
    paginationPageSize = 10,
    rowCount = 0,
    rowData = [],
    withSkeleton = false,
    ...rest
  }: TableProps,
  ref: any,
) {
  const grid = useRef<any>()
  const [pagination, setPagination] = useState<{
    page: number
    rowsPerPage: number
  }>({
    page: 0,
    rowsPerPage: paginationPageSize,
  })
  const theme: ThemeSlice = useStore((state) => state.theme)
  const i18n: I18nSlice = useStore((state) => state.i18n)

  // baseColDef sets props common to all Columns
  const baseColDef: ColDef = useMemo(
    () => ({
      cellRenderer: (props: any) => {
        return (
          <Typography component="span">
            {props.data.isSkeleton ? <Skeleton /> : props.value}
          </Typography>
        )
      },
      headerComponent: (props: any) => {
        return <Typography component="span">{props.displayName}</Typography>
      },
      sortable: true,
    }),
    [],
  )

  // Define row data with skeleton
  const results = useMemo(() => {
    if (!withSkeleton) return rowData
    if (Array.isArray(rowData)) {
      return rowData.length === 0
        ? times(pagination.rowsPerPage, () => {
            return {
              isSkeleton: true,
            }
          })
        : rowData
    }
    return rowData
    /* eslint-disable-next-line */
  }, [withSkeleton, rowData])

  function handlePageChange(page: number) {
    setPagination((prevPagination) => {
      const newPagination = { ...prevPagination, page: page }
      onPaginationChanged(newPagination)
      return { ...prevPagination, page: page }
    })
    grid.current.api.paginationGoToPage(page)
  }

  function handleRowsPerPageChange(rowsPerPage: number | string) {
    setPagination(() => {
      const newPagination = {
        page: 0,
        rowsPerPage:
          typeof rowsPerPage === 'string'
            ? parseInt(rowsPerPage, 10)
            : rowsPerPage,
      }
      onPaginationChanged(newPagination)
      return newPagination
    })
    grid.current.api.paginationGoToPage(0)
  }

  return (
    <FadeInOut
      className={cx('relative table w-full rounded', {
        'ag-theme-alpine': theme.mode !== 'dark',
        'ag-theme-alpine-dark': theme.mode === 'dark',
      })}
    >
      {loading && !(withSkeleton && results?.[0]?.isSkeleton) && (
        <Loading className="bg-action-disabledBackground/5" />
      )}
      <AgGridReact
        animateRows={true}
        defaultColDef={{ ...baseColDef, ...defaultColDef }}
        domLayout="autoHeight"
        enableCellChangeFlash={false}
        enableCellTextSelection={true}
        enableRtl={i18n.dir === 'rtl'}
        pagination={enablePagination}
        paginationPageSize={pagination.rowsPerPage}
        rowData={results}
        suppressCellFocus={true}
        suppressDragLeaveHidesColumns={true}
        suppressLoadingOverlay={true}
        suppressMovableColumns={true}
        suppressPaginationPanel={true}
        suppressRowClickSelection={true}
        suppressRowHoverHighlight={true}
        onFirstDataRendered={(event) => {
          onFirstDataRendered(event)
          // event.columnApi.autoSizeAllColumns()
        }}
        ref={(gridRef) => {
          grid.current = gridRef
          if (ref) {
            ref.current = gridRef
          }
        }}
        {...rest}
      />
      {enablePagination && (
        <TablePagination
          className="rounded rounded-tl-none rounded-tr-none border border-t-0 border-solid border-mui-box-border bg-mui-box-background pr-2"
          backIconButtonProps={{ disabled: loading || pagination.page <= 0 }}
          component="div"
          count={rowCount}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          rowsPerPageOptions={[10, 20, 30, 40, 50]}
          SelectProps={{
            disabled: loading,
          }}
          nextIconButtonProps={{
            disabled:
              loading ||
              pagination.page >=
                Math.ceil(rowCount / pagination.rowsPerPage) - 1,
          }}
          onPageChange={(_, page) => {
            handlePageChange(page)
          }}
          onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            handleRowsPerPageChange(event.target.value)
          }}
        />
      )}
    </FadeInOut>
  )
}

export default forwardRef(Table)

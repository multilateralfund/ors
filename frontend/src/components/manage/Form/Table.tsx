'use client'
import type { I18nSlice } from '@ors/slices/createI18nSlice'
import type { ThemeSlice } from '@ors/slices/createThemeSlice'

import { Fragment, MutableRefObject, useMemo, useRef, useState } from 'react'

import {
  Tooltip as MuiTooltip,
  Skeleton,
  TablePagination,
  Typography,
} from '@mui/material'
import { ColDef } from 'ag-grid-community'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import cx from 'classnames'
import { times } from 'lodash'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import Loading from '@ors/components/theme/Loading/Loading'
import { KEY_ENTER } from '@ors/constants'
import useStore from '@ors/store'

type TableProps = {
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
  withSeparators?: boolean
  withSkeleton?: boolean
} & Omit<AgGridReactProps, 'onPaginationChanged'>

export default function Table(props: TableProps) {
  const grid = useRef<any>()
  const {
    className,
    defaultColDef = {},
    enablePagination = true,
    gridRef,
    loading = false,
    onFirstDataRendered = () => {},
    onPaginationChanged = ({}: { page: number; rowsPerPage: number }) => {},
    paginationPageSize = 10,
    rowCount = 0,
    rowData = [],
    withSeparators = false,
    withSkeleton = false,
    ...rest
  } = props
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
      autoHeaderHeight: true,
      cellRenderer: (props: any) => {
        const Tooltip = props.colDef.tooltip ? MuiTooltip : Fragment
        return (
          <Tooltip enterDelay={300} placement="top-start" title={props.value}>
            <Typography component="span">
              {props.data.isSkeleton ? <Skeleton /> : props.value}
            </Typography>
          </Tooltip>
        )
      },
      enableCellChangeFlash: false,
      headerComponent: (props: any) => {
        return <Typography component="span">{props.displayName}</Typography>
      },
      sortable: true,
      suppressCellFlash: true,
      suppressKeyboardEvent: (params) => {
        const key = params.event.key
        return params.editing && key === KEY_ENTER
      },
      tooltip: true,
      wrapHeaderText: true,
    }),
    [],
  )

  // Define row data with skeleton
  const results = useMemo(() => {
    if (!withSkeleton) return rowData
    if (Array.isArray(rowData)) {
      return rowData.length === 0 && loading
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

  function handlePageChange(page: number, triggerEvent = true) {
    setPagination((prevPagination) => {
      const newPagination = { ...prevPagination, page: page }
      if (triggerEvent) {
        onPaginationChanged(newPagination)
      }
      return { ...prevPagination, page: page }
    })
  }

  function handleRowsPerPageChange(
    rowsPerPage: number | string,
    triggerEvent = true,
  ) {
    setPagination(() => {
      const newPagination = {
        page: 0,
        rowsPerPage:
          typeof rowsPerPage === 'string'
            ? parseInt(rowsPerPage, 10)
            : rowsPerPage,
      }
      if (triggerEvent) {
        onPaginationChanged(newPagination)
      }
      return newPagination
    })
  }

  return (
    <FadeInOut
      className={cx(
        'relative table w-full rounded border border-solid border-mui-box-border bg-mui-box-background',
        {
          'ag-theme-alpine': theme.mode !== 'dark',
          'ag-theme-alpine-dark': theme.mode === 'dark',
          'with-pagination': enablePagination,
          'with-separators': withSeparators,
        },
        className,
      )}
    >
      {loading && !(withSkeleton && results?.[0]?.isSkeleton) && (
        <Loading className="bg-action-disabledBackground/5" />
      )}
      <AgGridReact
        animateRows={false}
        defaultColDef={{ ...baseColDef, ...defaultColDef }}
        domLayout="autoHeight"
        enableCellChangeFlash={false}
        enableCellTextSelection={true}
        enableRtl={i18n.dir === 'rtl'}
        pagination={enablePagination}
        paginationPageSize={pagination.rowsPerPage}
        rowData={results}
        stopEditingWhenCellsLoseFocus={true}
        suppressAnimationFrame={true}
        suppressCellFocus={true}
        suppressDragLeaveHidesColumns={true}
        suppressLoadingOverlay={true}
        suppressMovableColumns={true}
        suppressPaginationPanel={true}
        suppressRowClickSelection={true}
        suppressRowHoverHighlight={true}
        noRowsOverlayComponent={() => {
          return (
            <Typography id="no-rows" component="span">
              No Rows To Show
            </Typography>
          )
        }}
        onFirstDataRendered={(agGrid) => {
          onFirstDataRendered(agGrid)
          // agGrid.columnApi.sizeColumnsToFit()
        }}
        ref={(agGrid) => {
          grid.current = agGrid
          if (!agGrid && gridRef) {
            gridRef.current = null
          }
          if (agGrid && gridRef) {
            gridRef.current = {
              ...agGrid,
              api: {
                ...agGrid.api,
                paginationGoToPage: (page: number, triggerEvent = false) => {
                  handlePageChange(page, triggerEvent)
                },
              },
            }
          }
        }}
        {...rest}
      />
      {enablePagination && (
        <TablePagination
          className="pr-2"
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

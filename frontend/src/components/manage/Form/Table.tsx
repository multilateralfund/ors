'use client'
import { I18nSlice, ThemeSlice } from '@ors/types/store'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { TablePagination, Typography } from '@mui/material'
import { ColDef } from 'ag-grid-community'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import cx from 'classnames'
import { isFunction, times } from 'lodash'

import {
  aggFuncs,
  components as defaultComponents,
} from '@ors/config/Table/Table'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import DefaultFadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Loading from '@ors/components/theme/Loading/Loading'
import { KEY_BACKSPACE, KEY_ENTER } from '@ors/constants'
import useStore from '@ors/store'

let timer: any

const debounce = (func: () => void) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(func, 200)
}

export default function Table(
  props: AgGridReactProps & {
    Toolbar?: React.FC<any>
    enableFullScreen?: boolean
    fadeInOut?: boolean
    headerDepth?: number
    rowsVisible?: number
    withFluidEmptyColumn?: boolean
  },
) {
  const uniqueId = useId()
  const grid = useRef<any>()
  const {
    id,
    Toolbar,
    className,
    collapsedRows = [],
    columnDefs = [],
    components = {},
    defaultColDef = {},
    domLayout = 'autoHeight',
    enableFullScreen = false,
    enablePagination = true,
    fadeInOut = true,
    gridRef,
    headerDepth = 1,
    loading = false,
    onColumnResized = () => {},
    onFirstDataRendered = () => {},
    onGridReady = () => {},
    onGridSizeChanged = () => {},
    onPaginationChanged = ({}: { page: number; rowsPerPage: number }) => {},
    onRowDataUpdated = () => {},
    paginationPageSize = 10,
    pinnedBottomRowData = [],
    rowBuffer = 40,
    rowClassRules = {},
    rowCount = 0,
    rowData = [],
    rowHeight = 45,
    rowsVisible = 15,
    style = {},
    withFluidEmptyColumn = false,
    withSeparators = false,
    withSkeleton = false,
    ...rest
  } = props
  const [offsetHeight, setOffsetHeight] = useState(0)
  const [pagination, setPagination] = useState<{
    page: number
    rowsPerPage: number
  }>({
    page: 0,
    rowsPerPage: paginationPageSize,
  })
  const theme: ThemeSlice = useStore((state) => state.theme)
  const i18n: I18nSlice = useStore((state) => state.i18n)
  const [fullScreen, setFullScreen] = useState(false)

  // baseColDef sets props common to all Columns
  const baseColDef: ColDef = useMemo(
    () => ({
      autoHeaderHeight: true,
      cellClass: (props) => {
        return cx({
          disabled: props.colDef.disabled,
        })
      },
      cellClassRules: {
        'ag-error': (props) =>
          !!(isFunction(props.colDef.error)
            ? props.colDef.error(props)
            : props.colDef.error),
      },
      cellRenderer: (props: any) => {
        return <AgCellRenderer {...props} />
      },
      comparator: () => 0,
      filter: false,
      sortable: false,
      sortingOrder: ['asc', 'desc', null],
      suppressKeyboardEvent: (props) => {
        const key = props.event.key
        const cellEditorParams = props.colDef.cellEditorParams || {}

        return (
          (props.editing && key === KEY_ENTER) ||
          (!props.editing && cellEditorParams.disableClearable && KEY_BACKSPACE)
        )
      },
      tooltip: false,
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
              rowType: 'skeleton',
            }
          })
        : rowData
    }
    return rowData
    /* eslint-disable-next-line */
  }, [withSkeleton, rowData, loading])

  // Normal layout table height
  const tableBodyHeight = useMemo(() => {
    if (domLayout !== 'normal' || !rowData?.length) return 0
    const rows = rowData.length + pinnedBottomRowData.length
    if (rows <= rowsVisible) {
      return rows * rowHeight + offsetHeight + headerDepth + 1
    }
    return rowsVisible * rowHeight + offsetHeight + headerDepth + 1
  }, [
    domLayout,
    headerDepth,
    offsetHeight,
    pinnedBottomRowData,
    rowData,
    rowHeight,
    rowsVisible,
  ])

  function updateOffsetHeight() {
    const table = document.getElementById(id || `table-${uniqueId}`)
    const headerHeight =
      table?.querySelector<HTMLElement>('.ag-header')?.offsetHeight || 0
    const horizontalScrollbarHeight =
      table?.querySelector<HTMLElement>('.ag-body-horizontal-scroll')
        ?.offsetHeight || 0
    setOffsetHeight(headerHeight + horizontalScrollbarHeight)
  }

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

  const FadeInOut = useMemo(
    () => (fadeInOut ? DefaultFadeInOut : 'div'),
    [fadeInOut],
  )

  useEffect(() => {
    if (fullScreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [fullScreen])

  return (
    <FadeInOut
      className={cx('table-root flex flex-col', {
        'ag-full-screen': fullScreen,
      })}
    >
      {Toolbar && (
        <div className="ag-toolbar">
          <Toolbar
            enterFullScreen={() => setFullScreen(true)}
            exitFullScreen={() => setFullScreen(false)}
            fullScreen={fullScreen}
            {...props}
          />
        </div>
      )}
      <div
        id={id || `table-${uniqueId}`}
        className={cx(
          'relative w-full',
          {
            'ag-theme-alpine': theme.mode !== 'dark',
            'ag-theme-alpine-dark': theme.mode === 'dark',
            'with-pagination': enablePagination,
            'with-separators': withSeparators,
          },
          className,
        )}
        style={{
          ...(tableBodyHeight > 0
            ? {
                height: tableBodyHeight,
              }
            : {}),
          ...style,
        }}
      >
        {loading && !(withSkeleton && results?.[0]?.rowType === 'skeleton') && (
          <Loading className="bg-action-disabledBackground/5" />
        )}
        <AgGridReact
          aggFuncs={aggFuncs}
          animateRows={false}
          defaultColDef={{ ...baseColDef, ...defaultColDef }}
          enableCellTextSelection={true}
          enableRtl={i18n.dir === 'rtl'}
          ensureDomOrder={true}
          pagination={enablePagination}
          paginationPageSize={pagination.rowsPerPage + collapsedRows.length}
          pinnedBottomRowData={pinnedBottomRowData}
          rowBuffer={rowBuffer}
          rowData={results}
          rowHeight={rowHeight}
          sortingOrder={['asc']}
          stopEditingWhenCellsLoseFocus={true}
          suppressCellFocus={true}
          suppressColumnVirtualisation={true}
          suppressDragLeaveHidesColumns={true}
          suppressLoadingOverlay={true}
          suppressMovableColumns={true}
          suppressMultiSort={true}
          suppressPaginationPanel={true}
          suppressRowClickSelection={true}
          suppressRowHoverHighlight={true}
          columnDefs={[
            ...(columnDefs || []),
            ...(withFluidEmptyColumn
              ? [
                  {
                    category: 'expand',
                    field: 'none',
                    flex: 1,
                    headerName: '',
                  },
                ]
              : []),
          ]}
          components={{
            ...defaultComponents,
            ...components,
          }}
          domLayout={
            fullScreen
              ? 'normal'
              : domLayout === 'normal'
              ? tableBodyHeight > 0
                ? 'normal'
                : 'autoHeight'
              : domLayout
          }
          noRowsOverlayComponent={(props: any) => {
            return (
              <Typography id="no-rows" component="span">
                {props.label || 'No Rows To Show'}
              </Typography>
            )
          }}
          ref={(agGrid) => {
            grid.current = agGrid
            if (!agGrid && gridRef) {
              gridRef.current = null
            }
            if (agGrid && gridRef) {
              gridRef.current = agGrid
              gridRef.current.paginationGoToPage = (
                page: number,
                triggerEvent = false,
              ) => {
                handlePageChange(page, triggerEvent)
              }
              if (enableFullScreen) {
                gridRef.current.enterFullScreen = () => {
                  setFullScreen(true)
                }
                gridRef.current.exitFullScreen = () => {
                  setFullScreen(false)
                }
              }
            }
          }}
          rowClassRules={{
            'ag-row-control': (props) => props.data.rowType === 'control',
            'ag-row-group': (props) => props.data.rowType === 'group',
            'ag-row-hashed': (props) => props.data.rowType === 'hashed',
            'ag-row-sub-total': (props) => props.data.rowType === 'subtotal',
            'ag-row-total': (props) => props.data.rowType === 'total',
            ...rowClassRules,
          }}
          onColumnResized={(event) => {
            debounce(updateOffsetHeight)
            onColumnResized(event)
          }}
          onFirstDataRendered={(agGrid) => {
            updateOffsetHeight()
            onFirstDataRendered(agGrid)
          }}
          onGridReady={(event) => {
            updateOffsetHeight()
            onGridReady(event)
          }}
          onGridSizeChanged={(event) => {
            debounce(updateOffsetHeight)
            onGridSizeChanged(event)
          }}
          onRowDataUpdated={(event) => {
            onRowDataUpdated(event)
          }}
          {...rest}
        />
        {enablePagination && (
          <TablePagination
            className="pr-2"
            component="div"
            count={rowCount}
            page={pagination.page}
            rowsPerPage={pagination.rowsPerPage}
            rowsPerPageOptions={[10, 20, 30, 40, 50]}
            SelectProps={{
              disabled: loading,
            }}
            backIconButtonProps={{
              disabled: loading || pagination.page <= 0,
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
            onRowsPerPageChange={(
              event: React.ChangeEvent<HTMLInputElement>,
            ) => {
              handleRowsPerPageChange(event.target.value)
            }}
          />
        )}
      </div>
    </FadeInOut>
  )
}

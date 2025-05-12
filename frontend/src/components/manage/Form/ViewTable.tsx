import { ThemeSlice } from '@ors/types/store'

import React, {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import styled from '@emotion/styled'
import { TablePagination, Typography } from '@mui/material'
import { ColDef, IRowNode, RowClassRules } from 'ag-grid-community'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import cx from 'classnames'
import {
  forEach,
  get,
  indexOf,
  isEmpty,
  isFunction,
  isObject,
  noop,
  omit,
  range,
  times,
} from 'lodash'

import {
  defaultColDef as globalColDef,
  defaultColGroupDef as globalColGroupDef,
} from '@ors/config/Table/columnsDef'

import { debounce, getError } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

type Pagination = {
  page: number
  rowsPerPage: number
  rowsPerPageOptions?: Array<number>
}

export type TableProps = {
  Toolbar?: React.FC<any>
  enableFullScreen?: boolean
  errors?: any
  headerDepth?: number
  paginationPageSizeSelector?: Array<number>
  resizeGridOnRowUpdate?: boolean
  rowsVisible?: number
  withFluidEmptyColumn?: boolean
} & AgGridReactProps

function cloneStyle(original: Element, clone: Element) {
  clone.setAttribute('style', original.getAttribute('style') || '')
}

function cloneClass(original: Element, clone: Element) {
  clone.className = original.className
}

// function getHeight(el: HTMLElement) {
//   if (el.style.height) {
//     return Number(el.style.height.replace('px', '')) || el.clientHeight
//   }
//   return el.clientHeight
// }

function getInitialRowData({ rowData, rowsVisible, withSkeleton }: any) {
  if (!withSkeleton) return rowData
  if (!rowData || rowData.length === 0) {
    return times(rowsVisible, (row) => {
      return {
        id: `skeleton-${row}`,
        rowType: 'skeleton',
      }
    })
  }
  return rowData
}

function setupFixedHeaderObserver(agHeader: HTMLDivElement) {
  const agHeaderParent = agHeader.parentElement as HTMLDivElement
  const agHeaderParentInitialPadding = agHeaderParent.style.paddingTop
  const agHeaderScroll = agHeaderParent.querySelector(
    '.ag-body-horizontal-scroll',
  ) as HTMLDivElement
  const agHeaderIntialWidth = agHeader.style.width

  const rectScroll = agHeaderScroll.getBoundingClientRect()
  const rectHeader = agHeader.getBoundingClientRect()

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.intersectionRatio && entry.intersectionRect.top < 10) {
        agHeaderScroll.style.top = '0'
        agHeaderScroll.style.setProperty('position', 'fixed', 'important')
        agHeaderScroll.style.setProperty('z-index', '10', 'important')
        agHeaderScroll.style.setProperty('background', 'white')
        agHeaderScroll.style.width = `${entry.boundingClientRect.width}px`

        agHeader.style.width = `${entry.boundingClientRect.width}px`
        // setting style directly instead of class, seems to be much more responsive
        agHeader.style.top = `${rectScroll.height}px`
        agHeader.style.position = 'fixed'
        agHeader.style.zIndex = '10'

        agHeaderParent.style.paddingTop = `${rectHeader.height + rectScroll.height}px`
      } else {
        agHeader.style.width = agHeaderIntialWidth
        agHeader.style.top = ''
        agHeader.style.position = ''
        agHeader.style.zIndex = ''

        agHeaderScroll.style.removeProperty('top')
        agHeaderScroll.style.removeProperty('position')
        agHeaderScroll.style.removeProperty('z-index')
        agHeaderScroll.style.removeProperty('background')
        agHeaderScroll.style.removeProperty('width')

        agHeaderParent.style.paddingTop = agHeaderParentInitialPadding
      }
    },
    {
      threshold: range(1, 101).map((v) => v / 100), // [..., 0.09, 0.1] instead of [..., 0.09, 0.09999999...]
    },
  )
  observer.observe(agHeaderParent)
  return observer
}

const AgGridWrapper: any = styled('div')`
  --ag-header-depth: ${(props: any) => props.headerDepth ?? 1} !important;
  --ag-header-height: ${(props: any) => props.headerHeight ?? 36}px !important;
  --ag-row-height: ${(props: any) => props.rowHeight ?? 36}px !important;
`

function ViewTable(props: TableProps) {
  const {
    id,
    Toolbar,
    className,
    columnDefs,
    components = {},
    domLayout = 'normal',
    enableFullScreen = false,
    enablePagination = false,
    gridRef,
    headerDepth = 1,
    loading,
    onColumnResized = noop,
    onFirstDataRendered = noop,
    onGridReady = noop,
    onGridSizeChanged = noop,
    onPaginationChanged = noop,
    onRowDataUpdated = noop,
    paginationPageSize = 10,
    paginationPageSizeSelector,
    pinnedBottomRowData,
    resizeGridOnRowUpdate = false,
    rowBuffer = 20,
    rowCount = 0,
    rowHeight = 36,
    rowsVisible = 15,
    withFluidEmptyColumn = false,
    withSeparators = false,
    withSkeleton = false,
  } = props
  const uniqueId = useId()
  const grid = useRef<AgGridReact | null>(null)
  const tableEl = useRef<HTMLDivElement>(null)
  const scrollMutationObserver = useRef<any>(null)
  const headerIntersectionObserver = useRef<IntersectionObserver | null>(null)

  const gridContext = props.context

  const [pagination, setPagination] = useState<Pagination>({
    page: 0,
    rowsPerPage: paginationPageSize,
  })
  const [fullScreen, setFullScreen] = useState(false)

  // defaultColDef sets props common to all Columns
  const [defaultColDef] = useState<ColDef>(() => ({
    ...globalColDef,
    autoHeaderHeight: false, // setting this to true will cause header cells to not span rows, it can be set on individual columns, where needed
    cellClass: (params) => {
      return cx(
        {
          disabled: params.colDef.disabled,
        },
        isFunction(props.defaultColDef?.cellClass)
          ? props.defaultColDef?.cellClass(params)
          : props.defaultColDef?.cellClass,
      )
    },
    comparator: () => 0,
    filter: false,
    sortable: false,
    sortingOrder: ['asc', 'desc', null],
    tooltip: false,
    wrapHeaderText: true,
    ...omit(props.defaultColDef, ['cellClass']),
  }))

  const [rowClassRules] = useState<RowClassRules>(() => ({
    'ag-row-control': (props) => props.data.rowType === 'control',
    'ag-row-error': (props) => !!props.data.error,
    'ag-row-group': (props) => props.data.rowType === 'group',
    'ag-row-hashed': (props) => props.data.rowType === 'hashed',
    'ag-row-sub-total': (props) => props.data.rowType === 'subtotal',
    'ag-row-total': (props) => props.data.rowType === 'total',
    ...props.rowClassRules,
  }))

  // Define row data with skeleton
  const [initialRowData] = useState(
    getInitialRowData({ rowData: props.rowData, rowsVisible, withSkeleton }),
  )
  const [initialPinnedBottomRowData] = useState(pinnedBottomRowData)

  function updatePagination(newPagination: any, triggerEvent = false) {
    const currentPagination = {
      page: newPagination.page ?? pagination.page,
      rowsPerPage: newPagination.rowsPerPage ?? pagination.rowsPerPage,
    }
    if (triggerEvent) {
      onPaginationChanged(currentPagination)
    }
    setPagination(currentPagination)
  }

  const updateTableHeight = useCallback(() => {
    if (grid.current) {
      const gridApi = grid.current.api
      const agTableRoot = tableEl.current
      if (domLayout !== 'normal' || !agTableRoot) return
      const agTable = agTableRoot.querySelector<HTMLElement>('.ag-table')
      const agHeader = agTableRoot?.querySelector<HTMLElement>('.ag-header')
      const agHorizontalScroll = agTableRoot?.querySelector<HTMLElement>(
        '.ag-body-horizontal-scroll',
      )
      if (!agTable) return
      const offsetHeight =
        (agHeader?.offsetHeight || 0) +
        2 * (agHorizontalScroll?.offsetHeight || 0)
      const rows = gridApi?.getDisplayedRowCount()
      if (rows && rows <= rowsVisible) {
        agTable.style.height = `${
          rows * rowHeight + offsetHeight + headerDepth + 1
        }px`
      }
      if (rows && rows > rowsVisible) {
        agTable.style.height = `${
          rowsVisible * rowHeight + offsetHeight + headerDepth + 1
        }px`
      }
      if (!rows && props.rowData?.length === 0) {
        agTable.style.height = 'auto'
        gridApi?.setGridOption('domLayout', 'autoHeight')
      } else if (domLayout !== gridApi?.getGridOption('domLayout')) {
        gridApi?.setGridOption('domLayout', domLayout)
      }
    }
  }, [domLayout, headerDepth, rowHeight, rowsVisible, grid, props.rowData])

  function enterFullScreen() {
    if (grid.current) {
      setFullScreen(true)
      grid.current.api?.setGridOption('domLayout', 'normal')
    }
  }

  function exitFullScreen() {
    if (grid.current) {
      setFullScreen(false)
      grid.current.api?.setGridOption('domLayout', domLayout)
    }
  }

  useEffect(() => {
    if (grid.current) {
      grid.current.api?.setGridOption('rowData', props.rowData)
    }
  }, [props.rowData])

  useEffect(() => {
    if (grid.current) {
      if (loading) {
        grid.current.api?.showLoadingOverlay()
      } else if (!loading && props.rowData?.length) {
        grid.current.api?.hideOverlay()
      }
    }
  }, [loading, props.rowData])

  useEffect(() => {
    /**
     * Update rowData if grid is ready
     */
    if (grid.current) {
      grid.current.api?.setGridOption(
        'pinnedBottomRowData',
        pinnedBottomRowData,
      )
    }
  }, [pinnedBottomRowData])

  useEffect(() => {
    return () => {
      if (scrollMutationObserver.current) {
        scrollMutationObserver.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    // This is mostly for hot reload...
    const agHeader =
      tableEl.current?.querySelector<HTMLDivElement>('.ag-header')
    if (agHeader) {
      headerIntersectionObserver.current = setupFixedHeaderObserver(agHeader)
    }
    return () => {
      if (headerIntersectionObserver.current) {
        headerIntersectionObserver.current.disconnect()
      }
    }
  }, [])

  return (
    <div
      className={cx('ag-table-root flex flex-col', {
        'ag-full-screen': fullScreen,
      })}
      ref={tableEl}
    >
      {Toolbar && (
        <div className="ag-toolbar">
          <Toolbar
            {...props}
            enterFullScreen={enterFullScreen}
            exitFullScreen={exitFullScreen}
            fullScreen={fullScreen}
            gridContext={gridContext}
            onUnitSelectionChange={props.handleUnitSelectionChange}
          />
        </div>
      )}
      <AgGridWrapper
        id={id || `table-${uniqueId}`}
        className={cx(
          'ag-table ag-theme-ors ag-theme-alpine relative w-full',
          {
            'with-separators': withSeparators,
          },
          className,
        )}
        headerDepth={headerDepth}
        rowHeight={rowHeight}
      >
        <AgGridReact
          alwaysShowHorizontalScroll={true}
          animateRows={false}
          components={components}
          context={gridContext}
          defaultColDef={defaultColDef}
          defaultColGroupDef={props?.defaultColGroupDef || globalColGroupDef}
          enableCellTextSelection={true}
          ensureDomOrder={false}
          pagination={false}
          pinnedBottomRowData={initialPinnedBottomRowData}
          rowBuffer={rowBuffer}
          rowClassRules={rowClassRules}
          rowData={initialRowData}
          sortingOrder={['asc']}
          stopEditingWhenCellsLoseFocus={true}
          suppressCellFocus={true}
          suppressColumnMoveAnimation={true}
          suppressDragLeaveHidesColumns={true}
          suppressMovableColumns={true}
          suppressMultiSort={true}
          suppressPaginationPanel={true}
          suppressPropertyNamesCheck={true}
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
          noRowsOverlayComponent={(props: any) => {
            return (
              <Typography id="no-rows" component="span">
                {props.label || 'No rows to show'}
              </Typography>
            )
          }}
          ref={(agGrid) => {
            grid.current = agGrid
            if (gridRef) {
              gridRef.current = agGrid
            }
            if (!gridRef || !agGrid) return
            gridRef.current.paginationGoToPage = (
              page: number,
              triggerEvent = false,
            ) => {
              updatePagination({ page }, triggerEvent)
            }
            if (enableFullScreen) {
              gridRef.current.enterFullScreen = enterFullScreen
              gridRef.current.exitFullScreen = exitFullScreen
            }
          }}
          onColumnResized={(props) => {
            onColumnResized(props)
            if (!fullScreen) {
              debounce(updateTableHeight)
            }
          }}
          onFirstDataRendered={(agGrid) => {
            onFirstDataRendered(agGrid)
            if (!fullScreen) {
              updateTableHeight()
            }
          }}
          onGridReady={(props) => {
            onGridReady(props)
            if (!fullScreen) {
              updateTableHeight()
            }

            if (!tableEl.current) return
            const tableRoot = tableEl.current.querySelector('.ag-root')
            // Get original scroll
            const agScroll = tableRoot?.querySelector(
              '.ag-body-horizontal-scroll',
            )
            const agLeftSpacer = agScroll?.querySelector(
              '.ag-horizontal-left-spacer',
            )
            const agRightSpacer = agScroll?.querySelector(
              '.ag-horizontal-right-spacer',
            )
            const agScrollViewport = agScroll?.querySelector(
              '.ag-body-horizontal-scroll-viewport',
            )
            const agScrollContainer = agScroll?.querySelector(
              '.ag-body-horizontal-scroll-container',
            )
            // Get clone scroll
            const cloneAgScroll = agScroll?.cloneNode(true) as Element
            const cloneAgLeftSpacer = cloneAgScroll?.querySelector(
              '.ag-horizontal-left-spacer',
            )
            const cloneAgRightSpacer = cloneAgScroll?.querySelector(
              '.ag-horizontal-right-spacer',
            )
            const cloneAgScrollViewport = cloneAgScroll?.querySelector(
              '.ag-body-horizontal-scroll-viewport',
            )
            const cloneAgScrollContainer = cloneAgScroll?.querySelector(
              '.ag-body-horizontal-scroll-container',
            )
            if (
              !tableRoot ||
              !agScroll ||
              !agLeftSpacer ||
              !agRightSpacer ||
              !agScrollViewport ||
              !agScrollContainer ||
              !cloneAgScroll ||
              !cloneAgLeftSpacer ||
              !cloneAgRightSpacer ||
              !cloneAgScrollViewport ||
              !cloneAgScrollContainer
            ) {
              return
            }
            // Insert clone scroll
            tableRoot.insertBefore(cloneAgScroll, tableRoot.firstChild)
            // add event listeners to keep scroll position synchronized
            agScrollViewport.addEventListener('scroll', () => {
              cloneAgScrollViewport.scrollTo({
                left: agScrollViewport.scrollLeft,
              })
            })
            cloneAgScrollViewport.addEventListener('scroll', () => {
              agScrollViewport.scrollTo({
                left: cloneAgScrollViewport.scrollLeft,
              })
            })
            // scroll mutation observer to keep size sync
            const scrollElements = [
              agScroll,
              agLeftSpacer,
              agRightSpacer,
              agScrollViewport,
              agScrollContainer,
            ]
            const cloneScrollElements = [
              cloneAgScroll,
              cloneAgLeftSpacer,
              cloneAgRightSpacer,
              cloneAgScrollViewport,
              cloneAgScrollContainer,
            ]
            scrollMutationObserver.current = new MutationObserver(
              (mutationList) => {
                forEach(mutationList, (mutation) => {
                  const element = indexOf(scrollElements, mutation.target)
                  if (element > -1) {
                    cloneStyle(
                      scrollElements[element],
                      cloneScrollElements[element],
                    )
                    cloneClass(
                      scrollElements[element],
                      cloneScrollElements[element],
                    )
                  }
                })
              },
            )
            // start observing the scroll elements for `style` attribute changes
            scrollMutationObserver.current.observe(agScroll, {
              attributeFilter: ['style', 'class'],
              subtree: true,
            })

            const agHeader =
              tableEl.current?.querySelector<HTMLDivElement>('.ag-header')
            if (agHeader) {
              headerIntersectionObserver.current =
                setupFixedHeaderObserver(agHeader)
            }
          }}
          onGridSizeChanged={(props) => {
            onGridSizeChanged(props)
            if (!fullScreen) {
              debounce(updateTableHeight)
            }
          }}
          onRowDataUpdated={(props) => {
            // props.api.autoSizeAllColumns()
            // props.api.sizeColumnsToFit()
            onRowDataUpdated(props)

            if (resizeGridOnRowUpdate) {
              updateTableHeight()
            }
          }}
          {...omit(props, [
            'pagination',
            'paginationPageSize',
            'suppressPaginationPanel',
            'gridRef',
            'components',
            'defaultColDef',
            'defaultColGroupDef',
            'pinnedBottomRowData',
            'rowBuffer',
            'rowClassRules',
            'rowData',
            'columnDefs',
            'ref',
            'onCellKeyDown',
            'onColumnResized',
            'onFirstDataRendered',
            'onGridReady',
            'onGridSizeChanged',
            'onPaginationChanged',
            'onRowDataUpdated',
            'style',
            'context',
          ])}
        />
      </AgGridWrapper>
      {enablePagination && (
        <TablePagination
          className="pr-2"
          component="div"
          count={rowCount}
          disabled={loading}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          rowsPerPageOptions={paginationPageSizeSelector || [10, 25, 50, 100]}
          onPageChange={(_, page) => {
            updatePagination(
              {
                page,
                rowsPerPage: pagination.rowsPerPage,
              },
              true,
            )
          }}
          onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            updatePagination(
              {
                page: pagination.page,
                rowsPerPage: event.target.value,
              },
              true,
            )
          }}
        />
      )}
    </div>
  )
}

export default React.memo(ViewTable)

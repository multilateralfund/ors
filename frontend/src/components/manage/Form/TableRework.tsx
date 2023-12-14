'use client'
import { I18nSlice, ThemeSlice } from '@ors/types/store'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import React from 'react'

import { TablePagination, Typography } from '@mui/material'
import { ColDef, RowClassRules, RowNode } from 'ag-grid-community-latest'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react-latest'
import cx from 'classnames'
import {
  differenceWith,
  findIndex,
  forEach,
  get,
  indexOf,
  isEmpty,
  isEqual,
  isFunction,
  isNull,
  isObject,
  noop,
  omit,
  times,
} from 'lodash'

import { components as defaultComponents } from '@ors/config/Table/Table'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import DefaultFadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import { KEY_BACKSPACE } from '@ors/constants'
import { applyTransaction, debounce, getError } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

type Pagination = {
  page: number
  rowsPerPage: number
}

type TableProps = AgGridReactProps & {
  Toolbar?: React.FC<any>
  enableFullScreen?: boolean
  errors?: any
  fadeInOut?: boolean
  headerDepth?: number
  rowsVisible?: number
  withFluidEmptyColumn?: boolean
}

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

function getRowData({ loading, pagination, rowData, withSkeleton }: any) {
  if (!withSkeleton) return rowData
  if (Array.isArray(rowData)) {
    return rowData.length === 0 && loading
      ? times(pagination.rowsPerPage, (row) => {
          return {
            id: `skeleton-${row}`,
            rowType: 'skeleton',
          }
        })
      : rowData
  }
  return rowData
}

export default function Table(props: TableProps) {
  const {
    id,
    Toolbar,
    className,
    columnDefs,
    domLayout = 'autoHeight',
    enableFullScreen = false,
    enablePagination = true,
    errors,
    fadeInOut = true,
    gridRef,
    headerDepth = 1,
    loading = false,
    onCellKeyDown = noop,
    onCellValueChanged = noop,
    onColumnResized = noop,
    onFirstDataRendered = noop,
    onGridReady = noop,
    onGridSizeChanged = noop,
    onPaginationChanged = ({}: { page: number; rowsPerPage: number }) => {},
    onRowDataUpdated = noop,
    paginationPageSize = 10,
    pinnedBottomRowData,
    rowBuffer = 40,
    rowCount = 0,
    rowHeight = 36,
    rowsVisible = 15,
    style,
    withFluidEmptyColumn = false,
    withSeparators = false,
    withSkeleton = false,
  } = props
  const uniqueId = useId()
  const grid = useRef<any>({})
  const tableEl = useRef<HTMLDivElement>(null)
  const scrollMutationObserver = useRef<any>(null)

  const theme: ThemeSlice = useStore((state) => state.theme)
  const i18n: I18nSlice = useStore((state) => state.i18n)

  const [rendering, setRendering] = useState(true)
  const [offsetHeight, setOffsetHeight] = useState(0)
  const [pagination, setPagination] = useState<Pagination>({
    page: 0,
    rowsPerPage: paginationPageSize,
  })
  const [fullScreen, setFullScreen] = useState(false)
  const [print, setPrint] = useState<'solo' | boolean>(props.print)

  // defaultColDef sets props common to all Columns
  const [defaultColDef] = useState<ColDef>(() => ({
    autoHeaderHeight: true,
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
    cellClassRules: {
      'ag-error': (props) => !!getError(props),
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
      return key === KEY_BACKSPACE
    },
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

  const [components] = useState(() => ({
    ...defaultComponents,
    ...props.components,
  }))

  // Define row data with skeleton
  const [rowData, setRowData] = useState<any>(() => getRowData(props))
  const [initialRowData] = useState(rowData)
  const [initialPinnedBottomRowData] = useState(pinnedBottomRowData)

  // Normal layout table height
  const tableBodyHeight = useMemo(() => {
    if (domLayout !== 'normal' || !rowData?.length) return 0
    const rows = rowData.length + (pinnedBottomRowData || []).length
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

  const computedDomLayout = useMemo(() => {
    if (print) return 'print'
    if (fullScreen) return 'normal'
    if (domLayout === 'normal' && tableBodyHeight <= 0) return 'autoHeight'
    return domLayout
  }, [domLayout, fullScreen, print, tableBodyHeight])

  function updateOffsetHeight() {
    const table = tableEl.current
    if (table) {
      const headerHeight =
        table?.querySelector<HTMLElement>('.ag-header')?.offsetHeight || 0
      const horizontalScrollbarHeight =
        table?.querySelector<HTMLElement>('.ag-body-horizontal-scroll')
          ?.offsetHeight || 0
      setOffsetHeight(headerHeight + horizontalScrollbarHeight)
      return
    }
    setOffsetHeight(0)
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

  function handleErrors() {
    const rowNodes: Array<any> = []
    const hasErrors = !isEmpty(errors)

    grid.current.api.forEachNode((rowNode: RowNode) => {
      if (rowNode.data.rowType) {
        return
      }
      const data = { ...rowNode.data }
      const error =
        hasErrors && isObject(errors) ? get(errors, data.row_id) : null

      if (!hasErrors && data.error) {
        delete data.error
        rowNodes.push({ ...rowNode, data })
      }
      if (hasErrors && error) {
        data.error = error
        rowNodes.push({ ...rowNode, data })
      }
      if (hasErrors && !error && !!data.error) {
        delete data.error
        rowNodes.push({ ...rowNode, data })
      }
    })

    if (rowNodes.length > 0) {
      applyTransaction(grid.current.api, {
        update: rowNodes.map((rowNode) => rowNode.data),
      })
      grid.current.api.refreshCells({
        force: true,
        rowNodes,
        suppressFlash: true,
      })
    }
  }

  const FadeInOut = useMemo(
    () => (fadeInOut ? DefaultFadeInOut : 'div'),
    [fadeInOut],
  )

  useEffect(() => {
    /**
     * Update rowData if grid is ready
     */
    if (!grid.current?.api) return
    const newRowData = getRowData({
      loading,
      pagination,
      rowData: props.rowData,
      withSkeleton,
    })
    if (
      !isEmpty(differenceWith(newRowData || [], rowData || [], isEqual)) ||
      newRowData?.length !== rowData?.length
    ) {
      setRowData(newRowData)
      grid.current.api.setGridOption('rowData', newRowData)
    }
  }, [
    loading,
    pagination,
    rowData,
    props.rowData,
    withSkeleton,
    pinnedBottomRowData,
  ])

  useEffect(() => {
    /**
     * Update rowData if grid is ready
     */
    if (!grid.current?.api) return
    grid.current.api.setGridOption('pinnedBottomRowData', pinnedBottomRowData)
  }, [pinnedBottomRowData])

  useEffect(() => {
    if (fullScreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [fullScreen])

  useEffect(() => {
    if (!grid.current.api) return
    handleErrors()
    /* eslint-disable-next-line */
  }, [errors])

  useEffect(() => {
    return () => {
      if (scrollMutationObserver.current) {
        scrollMutationObserver.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (!grid.current?.api) return
    if (loading) {
      grid.current.api.showLoadingOverlay()
    }
  }, [loading])

  return (
    <>
      <FadeInOut
        className={cx('table-root flex flex-col', {
          'ag-full-screen': fullScreen,
          'ag-print': print,
          'ag-rendering': rendering || isNull(rowData) || !rowData.length,
        })}
        ref={tableEl}
      >
        {Toolbar && (
          <div className="ag-toolbar">
            <Toolbar
              enterFullScreen={() => setFullScreen(true)}
              exitFullScreen={() => setFullScreen(false)}
              fullScreen={fullScreen || print}
              print={print}
              onPrint={() => {}}
              {...props}
            />
          </div>
        )}
        <div className="ag-table">
          <div
            id={id || `table-${uniqueId}`}
            className={cx(
              'relative w-full',
              {
                '!m-0': print === 'solo',
                'ag-theme-alpine': theme.mode !== 'dark',
                'ag-theme-alpine-dark': theme.mode === 'dark',
                'origin-top-left': print,
                'with-pagination': enablePagination,
                'with-separators': withSeparators,
              },
              className,
            )}
            style={{
              '--row-height': `${rowHeight}px`,
              ...(tableBodyHeight > 0
                ? {
                    height: tableBodyHeight,
                  }
                : {}),
              ...(style || {}),
            }}
          >
            <AgGridReact
              alwaysShowHorizontalScroll={true}
              animateRows={false}
              components={components}
              defaultColDef={defaultColDef}
              domLayout={computedDomLayout}
              enableCellTextSelection={true}
              enableRtl={i18n.dir === 'rtl'}
              ensureDomOrder={true}
              pagination={enablePagination}
              paginationPageSize={pagination.rowsPerPage}
              pinnedBottomRowData={initialPinnedBottomRowData}
              rowBuffer={rowBuffer}
              rowClassRules={rowClassRules}
              rowData={initialRowData}
              rowHeight={rowHeight}
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
                  grid.current.onPrint = () => {
                    setPrint('solo')
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
              onCellKeyDown={(props: any) => {
                onCellKeyDown(props)
                const key = props.event.key
                const { category, dataType, editable, field } = props.colDef
                const { row_id } = props.data
                const recordUsages = [...(props.data.record_usages || [])]
                const isEditable = isFunction(editable)
                  ? editable(props)
                  : editable
                if (isEditable && row_id && key === KEY_BACKSPACE) {
                  let value = null
                  const rowNode = props.api.getRowNode(row_id)
                  if (dataType === 'string') {
                    value = ''
                  }
                  if (dataType === 'number') {
                    value = 0
                  }
                  if (category === 'usage') {
                    const usageId = props.colDef.id
                    const index = findIndex(
                      recordUsages,
                      (item: any) => item.usage_id === usageId,
                    )
                    if (index > -1) {
                      recordUsages.splice(index, 1, {
                        ...recordUsages[index],
                        quantity: 0,
                      })
                    }
                  }
                  const data = { ...rowNode.data, [field]: value }
                  applyTransaction(props.api, {
                    update: [{ ...data, record_usages: recordUsages }],
                  })
                  onCellValueChanged({
                    ...props,
                    data,
                    source: 'cellClear',
                  })
                }
              }}
              onColumnResized={(props) => {
                onColumnResized(props)
                debounce(updateOffsetHeight)
              }}
              onFirstDataRendered={(agGrid) => {
                onFirstDataRendered(agGrid)
                updateOffsetHeight()
                setRendering(false)
                handleErrors()
              }}
              onGridReady={(props) => {
                onGridReady(props)
                updateOffsetHeight()

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
              }}
              onGridSizeChanged={(props) => {
                onGridSizeChanged(props)
                debounce(updateOffsetHeight)
              }}
              onRowDataUpdated={(props) => {
                if (!loading) {
                  props.api.hideOverlay()
                }
                onRowDataUpdated(props)
              }}
              {...omit(props, [
                'gridRef',
                'components',
                'defaultColDef',
                'domLayout',
                'enableRtl',
                'pagination',
                'paginationPageSize',
                'pinnedBottomRowData',
                'rowBuffer',
                'rowClassRules',
                'rowData',
                'rowHeight',
                'columnDefs',
                'ref',
                'onCellKeyDown',
                'onColumnResized',
                'onFirstDataRendered',
                'onGridReady',
                'onGridSizeChanged',
                'onPaginationChanged',
                'onRowDataUpdated',
              ])}
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
        </div>
      </FadeInOut>
    </>
  )
}

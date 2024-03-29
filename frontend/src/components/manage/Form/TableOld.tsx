'use client'
import { I18nSlice, ThemeSlice } from '@ors/types/store'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import React from 'react'

import { TablePagination, Typography } from '@mui/material'
import { ColDef, RowNode } from 'ag-grid-community'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import cx from 'classnames'
import {
  findIndex,
  forEach,
  get,
  indexOf,
  isEmpty,
  isFunction,
  isNull,
  isObject,
  // max,
  noop,
  times,
} from 'lodash'

import { components as defaultComponents } from '@ors/config/Table/Table'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import DefaultFadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Loading from '@ors/components/theme/Loading/Loading'
import { KEY_BACKSPACE } from '@ors/constants'
import { applyTransaction, debounce, getError } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import Portal from '../Utils/Portal'

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

export default function Table(
  props: AgGridReactProps & {
    Toolbar?: React.FC<any>
    enableFullScreen?: boolean
    errors?: any
    fadeInOut?: boolean
    headerDepth?: number
    rowsVisible?: number
    withFluidEmptyColumn?: boolean
  },
) {
  const uniqueId = useId()
  const grid = useRef<any>({})
  const tableEl = useRef<HTMLDivElement>(null)
  const scrollMutationObserver = useRef<any>(null)
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
    pinnedBottomRowData = [],
    rowBuffer = 40,
    rowClassRules = {},
    rowCount = 0,
    rowData = [],
    rowHeight = 36,
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
  const [print, setPrint] = useState<'solo' | boolean>(props.print)
  const [rendering, setRendering] = useState(true)

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

  // function updatePinnedBottomHeight() {
  //   if (!tableEl.current) return
  //   const pinnedBottomEl = tableEl.current.querySelector(
  //     '.ag-floating-bottom',
  //   ) as HTMLElement
  //   const pinnedBottomViewport = pinnedBottomEl?.querySelector(
  //     '.ag-floating-bottom-viewport',
  //   ) as HTMLElement

  //   if (!pinnedBottomEl || !pinnedBottomViewport) return

  //   function setHeight(children?: HTMLCollectionOf<HTMLElement>) {
  //     let height = 0
  //     if (!children) return 0
  //     for (const child of children) {
  //       child.style.transform = `translateY(${height}px)`
  //       height += getHeight(child)
  //     }
  //     return height
  //   }

  //   const pinnedBottomHeight = max([
  //     setHeight(
  //       pinnedBottomViewport.querySelector('.ag-floating-bottom-container')
  //         ?.children as HTMLCollectionOf<HTMLElement>,
  //     ),
  //     setHeight(
  //       pinnedBottomEl.querySelector('.ag-pinned-left-floating-bottom')
  //         ?.children as HTMLCollectionOf<HTMLElement>,
  //     ),
  //     setHeight(
  //       pinnedBottomEl.querySelector('.ag-pinned-right-floating-bottom')
  //         ?.children as HTMLCollectionOf<HTMLElement>,
  //     ),
  //   ])
  //   pinnedBottomEl.style.height = `${pinnedBottomHeight}px`
  // }

  const FadeInOut = useMemo(
    () => (fadeInOut ? DefaultFadeInOut : 'div'),
    [fadeInOut],
  )

  // useEffect(() => {
  //   updatePinnedBottomHeight()
  // })

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

  return (
    <Portal active={print === 'solo'} domNode="print-content">
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
              ...style,
            }}
          >
            {loading &&
              !(withSkeleton && results?.[0]?.rowType === 'skeleton') && (
                <Loading className="bg-action-disabledBackground/5" />
              )}
            <AgGridReact
              alwaysShowHorizontalScroll={true}
              animateRows={false}
              domLayout={computedDomLayout}
              enableCellTextSelection={true}
              enableRtl={i18n.dir === 'rtl'}
              ensureDomOrder={true}
              pagination={enablePagination}
              paginationPageSize={pagination.rowsPerPage + collapsedRows.length}
              pinnedBottomRowData={print ? [] : pinnedBottomRowData}
              rowBuffer={rowBuffer}
              rowHeight={rowHeight}
              sortingOrder={['asc']}
              stopEditingWhenCellsLoseFocus={true}
              suppressCellFocus={true}
              suppressColumnMoveAnimation={true}
              suppressDragLeaveHidesColumns={true}
              suppressLoadingOverlay={true}
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
              components={{
                ...defaultComponents,
                ...components,
              }}
              defaultColDef={{
                ...baseColDef,
                ...defaultColDef,
                cellClass: (props) => {
                  return cx(
                    isFunction(baseColDef.cellClass)
                      ? baseColDef.cellClass(props)
                      : baseColDef.cellClass,
                    isFunction(defaultColDef.cellClass)
                      ? defaultColDef.cellClass(props)
                      : defaultColDef.cellClass,
                  )
                },
              }}
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
              rowClassRules={{
                'ag-row-control': (props) => props.data.rowType === 'control',
                'ag-row-error': (props) => !!props.data.error,
                'ag-row-group': (props) => props.data.rowType === 'group',
                'ag-row-hashed': (props) => props.data.rowType === 'hashed',
                'ag-row-sub-total': (props) =>
                  props.data.rowType === 'subtotal',
                'ag-row-total': (props) => props.data.rowType === 'total',
                ...rowClassRules,
              }}
              rowData={
                print && results
                  ? [...results, ...pinnedBottomRowData]
                  : results
              }
              onCellKeyDown={(props: any) => {
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
                onCellKeyDown(props)
              }}
              onCellValueChanged={(props) => {
                onCellValueChanged(props)
              }}
              onColumnResized={(props) => {
                debounce(updateOffsetHeight)
                onColumnResized(props)
              }}
              onFirstDataRendered={(agGrid) => {
                updateOffsetHeight()
                setRendering(false)
                handleErrors()
                onFirstDataRendered(agGrid)
              }}
              onGridReady={(props) => {
                updateOffsetHeight()
                onGridReady(props)

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
                // updatePinnedBottomHeight()
                debounce(updateOffsetHeight)
                onGridSizeChanged(props)
              }}
              onRowDataUpdated={(props) => {
                onRowDataUpdated(props)
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
        </div>
      </FadeInOut>
    </Portal>
  )
}

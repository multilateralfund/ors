'use client'
import { I18nSlice, ThemeSlice } from '@ors/types/store'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import React from 'react'

import { TablePagination, Typography } from '@mui/material'
import { ColDef, RowClassRules, RowNode } from 'ag-grid-community-latest'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react-latest'
import cx from 'classnames'
import {
  findIndex,
  forEach,
  get,
  indexOf,
  isEmpty,
  isFunction,
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
  rowsPerPageOptions?: Array<number>
}

type TableProps = AgGridReactProps & {
  Toolbar?: React.FC<any>
  errors?: any
  fadeInOut?: boolean
  headerDepth?: number
  paginationPageSizeSelector?: Array<number>
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

function getRowData({ pagination, rowData, withSkeleton }: any) {
  if (!withSkeleton) return rowData
  if (!rowData || rowData.length === 0) {
    return times(pagination.rowsPerPage, (row) => {
      return {
        id: `skeleton-${row}`,
        rowType: 'skeleton',
      }
    })
  }
  return rowData
}

export default function Table(props: TableProps) {
  const {
    id,
    Toolbar,
    className,
    columnDefs,
    domLayout = 'normal',
    enablePagination = false,
    errors,
    fadeInOut = true,
    gridRef,
    headerDepth = 1,
    loading,
    onCellKeyDown = noop,
    onCellValueChanged = noop,
    onColumnResized = noop,
    onFirstDataRendered = noop,
    onGridReady = noop,
    onGridSizeChanged = noop,
    onPaginationChanged = noop,
    onRowDataUpdated = noop,
    paginationPageSize = 10,
    paginationPageSizeSelector,
    pinnedBottomRowData,
    rowBuffer = 20,
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

  const [pagination, setPagination] = useState<Pagination>({
    page: 0,
    rowsPerPage: paginationPageSize,
  })

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
  const [initialRowData] = useState(
    getRowData({ pagination, rowData: props.rowData, withSkeleton }),
  )
  const [initialPinnedBottomRowData] = useState(pinnedBottomRowData)

  const FadeInOut = useMemo(
    () => (fadeInOut ? DefaultFadeInOut : 'div'),
    [fadeInOut],
  )

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

  function updatePagination(newPagination: any, triggerEvent = false) {
    const currentPagination = {
      page: newPagination.page || pagination.page,
      rowsPerPage: newPagination.rowsPerPage || pagination.rowsPerPage,
    }
    if (triggerEvent) {
      onPaginationChanged(currentPagination)
    }
    setPagination(currentPagination)
  }

  function updateTableHeight() {
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
    const rows = grid.current.api.getDisplayedRowCount()
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
    if (!rows) {
      agTable.style.height = 'auto'
      grid.current.api.setGridOption('domLayout', 'autoHeight')
    } else if (domLayout !== grid.current.api.getGridOption('domLayout')) {
      grid.current.api.setGridOption('domLayout', domLayout)
    }
  }

  useEffect(() => {
    if (!grid.current?.api) return
    grid.current.api.setGridOption('rowData', props.rowData)
  }, [props.rowData])

  useEffect(() => {
    if (!grid.current?.api) return
    if (loading) {
      grid.current.api.showLoadingOverlay()
    } else if (!loading && props.rowData?.length) {
      grid.current.api.hideOverlay()
    }
  }, [loading, props.rowData])

  useEffect(() => {
    /**
     * Update rowData if grid is ready
     */
    if (!grid.current?.api) return
    grid.current.api.setGridOption('pinnedBottomRowData', pinnedBottomRowData)
  }, [pinnedBottomRowData])

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
    <>
      <FadeInOut className={cx('ag-table-root flex flex-col')} ref={tableEl}>
        {Toolbar && (
          <div className="ag-toolbar">
            <Toolbar {...props} />
          </div>
        )}
        <div
          id={id || `table-${uniqueId}`}
          className={cx(
            'ag-table relative w-full',
            {
              'ag-theme-alpine': theme.mode !== 'dark',
              'ag-theme-alpine-dark': theme.mode === 'dark',
              'with-separators': withSeparators,
            },
            className,
          )}
          style={{
            '--row-height': `${rowHeight}px`,
            ...(style || {}),
          }}
        >
          <AgGridReact
            alwaysShowHorizontalScroll={true}
            animateRows={false}
            components={components}
            defaultColDef={defaultColDef}
            enableCellTextSelection={true}
            enableRtl={i18n.dir === 'rtl'}
            ensureDomOrder={true}
            pagination={false}
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
                  updatePagination({ page }, triggerEvent)
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
              debounce(updateTableHeight)
            }}
            onFirstDataRendered={(agGrid) => {
              onFirstDataRendered(agGrid)
              updateTableHeight()
              handleErrors()
            }}
            onGridReady={(props) => {
              onGridReady(props)
              updateTableHeight()

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
              debounce(updateTableHeight)
            }}
            onRowDataUpdated={(props) => {
              onRowDataUpdated(props)
            }}
            {...omit(props, [
              'pagination',
              'paginationPageSize',
              'suppressPaginationPanel',
              'gridRef',
              'components',
              'defaultColDef',
              'enableRtl',
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
        </div>
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
            onRowsPerPageChange={(
              event: React.ChangeEvent<HTMLInputElement>,
            ) => {
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
      </FadeInOut>
    </>
  )
}

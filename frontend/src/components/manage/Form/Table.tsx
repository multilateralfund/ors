'use client'
import type { I18nSlice } from '@ors/slices/createI18nSlice'
import type { ThemeSlice } from '@ors/slices/createThemeSlice'

import { Fragment, useId, useMemo, useRef, useState } from 'react'

import {
  Tooltip as MuiTooltip,
  Skeleton,
  TablePagination,
  Typography,
} from '@mui/material'
import { ColDef } from 'ag-grid-community'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import cx from 'classnames'
import dayjs from 'dayjs'
import {
  filter,
  find,
  get,
  includes,
  isNull,
  isUndefined,
  reduce,
  sum,
  times,
} from 'lodash'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import CellAutocompleteWidget from '@ors/components/manage/Widgets/CellAutocompleteWidget'
import CellDateWidget from '@ors/components/manage/Widgets/CellDateWidget'
import CellNumberWidget from '@ors/components/manage/Widgets/CellNumberWidget'
import CellTextareaWidget from '@ors/components/manage/Widgets/CellTextareaWidget'
import Loading from '@ors/components/theme/Loading/Loading'
import { KEY_BACKSPACE, KEY_ENTER } from '@ors/constants'
import { parseNumber } from '@ors/helpers/Utils/Utils'
import useStore from '@ors/store'

const aggFuncs = {
  sumTotal: (props: any) => {
    let value: null | number = null
    const values: Array<any> = []
    if (!includes(['subtotal', 'total'], props.data.rowType)) {
      return null
    }
    props.api.forEachNode(function (node: any) {
      if (
        props.data.rowType === 'subtotal' &&
        (!props.data.group || node.data.group !== props.data.group)
      ) {
        return
      }
      value = parseNumber(node.data[props.colDef.field])
      if (!isNull(value)) {
        values.push(value)
      }
    })
    return values.length > 0 ? sum(values) : undefined
  },
  sumTotalUsages: (props: any) => {
    let value: null | number = null
    const values: Array<any> = []
    const usageId = props.colDef.id
    if (!includes(['subtotal', 'total'], props.data.rowType)) {
      return null
    }
    props.api.forEachNode(function (node: any) {
      if (
        props.data.rowType === 'subtotal' &&
        (!props.data.group || node.data.annex_group !== props.data.group)
      ) {
        return
      }
      const recordUsages = node.data.record_usages || []

      if (usageId === 'total_usages') {
        value = parseNumber(
          sum(recordUsages.map((usage: any) => parseFloat(usage.quantity))),
        )
      } else if (usageId === 'total_refrigeration') {
        value = parseNumber(
          sum(
            filter(recordUsages, (usage) =>
              includes([6, 7], usage.usage_id),
            ).map((usage: any) => parseFloat(usage.quantity)),
          ),
        )
      } else {
        const usage = find(
          recordUsages,
          (item) =>
            item.usage_id === usageId &&
            !includes(node.data.excluded_usages, usageId),
        )
        value = parseNumber(usage?.quantity)
      }
      if (!isNull(value)) {
        values.push(value)
      }
    })
    return values.length > 0 ? sum(values) : undefined
  },
}

export function AgHeaderComponent(props: any) {
  const { displayName } = props

  return (
    <Typography className={props.className} component="span">
      {displayName}
    </Typography>
  )
}

export function AgHeaderGroupComponent(props: any) {
  return (
    <Typography className={props.className} component="span">
      {props.displayName}
    </Typography>
  )
}

export function AgSkeletonCellRenderer(props: any) {
  return (
    <Typography className={props.className} component="span">
      <Skeleton className="inline-block w-full" />
    </Typography>
  )
}

export function AgTextCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  const Tooltip = props.colDef.tooltip ? MuiTooltip : Fragment
  return (
    <Tooltip enterDelay={300} placement="top-start" title={props.value}>
      <Typography className={props.className} component="span">
        {props.value}
      </Typography>
    </Tooltip>
  )
}

export function AgFloatCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value = null
  const aggFunc = get(aggFuncs, props.colDef.aggFunc)
  const Tooltip = props.colDef.tooltip ? MuiTooltip : Fragment

  if (includes(['control', 'group'], props.data.rowType)) {
    return null
  }
  if (aggFunc && includes(['subtotal', 'total'], props.data.rowType)) {
    value = aggFunc({ ...props })
  } else {
    value = parseNumber(props.value)
  }

  if (isUndefined(value)) {
    return null
  }

  if (isNull(value)) {
    return '-'
  }

  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits: props.minimumFractionDigits || 2,
  })

  return (
    <Tooltip enterDelay={300} placement="top-start" title={formattedValue}>
      <Typography className={props.className} component="span">
        {formattedValue}
      </Typography>
    </Tooltip>
  )
}

export function AgDateCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  const value = dayjs(props.value).format('DD/MM/YYYY')
  const finalValue = value !== 'Invalid Date' ? value : null
  return !!props.value && <Typography component="span">{finalValue}</Typography>
}

export function AgUsageCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value = null
  const aggFunc = get(aggFuncs, props.colDef.aggFunc)
  const Tooltip = props.colDef.tooltip ? MuiTooltip : Fragment
  const usageId = props.colDef.id
  const recordUsages = props.data.record_usages || []

  if (
    props.data.rowType === 'group' ||
    includes(props.data.excluded_usages, usageId)
  ) {
    return null
  }
  if (aggFunc && includes(['subtotal', 'total'], props.data.rowType)) {
    value = aggFunc({ ...props })
  } else if (usageId === 'total_usages') {
    value = parseNumber(
      reduce(recordUsages, (total, usage) => {
        return total + parseFloat(usage.quantity)
      }),
    )
  } else if (usageId === 'total_refrigeration') {
    value = parseNumber(
      reduce(recordUsages, (total, usage) => {
        if (!includes([6, 7], usage.usage_id)) {
          return total
        }
        return total + parseFloat(usage.quantity)
      }),
    )
  } else {
    const usage = find(recordUsages, (item) => item.usage_id === usageId)
    value = parseNumber(usage?.quantity)
  }

  if (isUndefined(value)) {
    return null
  }

  if (isNull(value)) {
    return '-'
  }

  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits: props.minimumFractionDigits || 2,
  })

  return (
    <Tooltip enterDelay={300} placement="top-start" title={formattedValue}>
      <Typography className={props.className} component="span">
        {formattedValue}
      </Typography>
    </Tooltip>
  )
}

export function AgAdmCellRenderer(props: any) {
  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  let value = null
  const Tooltip = props.colDef.tooltip ? MuiTooltip : Fragment
  const columnId = props.colDef.id
  const values = props.data.values || []

  if (includes(['group', 'hashed'], props.data.rowType)) {
    value = null
  } else {
    value = find(values, (value) => value.column_id === columnId)?.value_text
  }

  return (
    <Tooltip enterDelay={300} placement="top-start" title={value}>
      <Typography className={props.className} component="span">
        {value}
      </Typography>
    </Tooltip>
  )
}

export default function Table(props: AgGridReactProps) {
  const uniqueId = useId()
  const grid = useRef<any>()
  const {
    className,
    collapsedRows = [],
    components = {},
    defaultColDef = {},
    enablePagination = true,
    gridRef,
    loading = false,
    onFirstDataRendered = () => {},
    onPaginationChanged = ({}: { page: number; rowsPerPage: number }) => {},
    paginationPageSize = 10,
    rowCount = 0,
    rowData = [],
    style,
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
      cellClass: (props) => {
        return cx({
          disabled: props.colDef.disabled,
        })
      },
      cellRenderer: 'agTextCellRenderer',
      comparator: () => 0,
      filter: true,
      // flex: 1,
      // minWidth: 100,
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
      id={`table-${uniqueId}`}
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
      style={style}
    >
      {loading && !(withSkeleton && results?.[0]?.rowType === 'skeleton') && (
        <Loading className="bg-action-disabledBackground/5" />
      )}
      <AgGridReact
        aggFuncs={aggFuncs}
        animateRows={false}
        defaultColDef={{ ...baseColDef, ...defaultColDef }}
        domLayout="autoHeight"
        enableCellTextSelection={true}
        enableRtl={i18n.dir === 'rtl'}
        pagination={enablePagination}
        paginationPageSize={pagination.rowsPerPage + collapsedRows.length}
        rowData={results}
        rowHeight={41}
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
        components={{
          agAdmCellRenderer: AgAdmCellRenderer,
          agColumnHeader: AgHeaderComponent,
          agColumnHeaderGroup: AgHeaderGroupComponent,
          agDateCellEditor: CellDateWidget,
          agDateCellRenderer: AgDateCellRenderer,
          agFloatCellRenderer: AgFloatCellRenderer,
          agNumberCellEditor: CellNumberWidget,
          agSelectCellEditor: CellAutocompleteWidget,
          agTextCellEditor: CellTextareaWidget,
          agTextCellRenderer: AgTextCellRenderer,
          agUsageCellRenderer: AgUsageCellRenderer,
          ...components,
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
            gridRef.current.getHeaderContainerHeight = () => {
              const table = document.getElementById(`table-${uniqueId}`)
              const header = table?.querySelector<HTMLElement>('.ag-header')
              if (header) {
                return header.offsetHeight
              }
              return 0
            }
            gridRef.current.getHorizontalScrollbarHeight = () => {
              const table = document.getElementById(`table-${uniqueId}`)
              const header = table?.querySelector<HTMLElement>(
                '.ag-body-horizontal-scroll',
              )
              if (header) {
                return header.offsetHeight
              }
              return 0
            }
          }
        }}
        onFirstDataRendered={(agGrid) => {
          onFirstDataRendered(agGrid)
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

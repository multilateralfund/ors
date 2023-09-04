'use client'
import type { I18nSlice } from '@ors/slices/createI18nSlice'
import type { ThemeSlice } from '@ors/slices/createThemeSlice'

import { Fragment, useMemo, useRef, useState } from 'react'

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
import { times } from 'lodash'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import CellAutocompleteWidget from '@ors/components/manage/Widgets/CellAutocompleteWidget'
import CellDateWidget from '@ors/components/manage/Widgets/CellDateWidget'
import CellNumberWidget from '@ors/components/manage/Widgets/CellNumberWidget'
import CellTextareaWidget from '@ors/components/manage/Widgets/CellTextareaWidget'
import Loading from '@ors/components/theme/Loading/Loading'
import { KEY_BACKSPACE, KEY_ENTER } from '@ors/constants'
import useStore from '@ors/store'

import { FaSort } from '@react-icons/all-files/fa/FaSort'
import { FaSortDown } from '@react-icons/all-files/fa/FaSortDown'
import { FaSortUp } from '@react-icons/all-files/fa/FaSortUp'

function AgHeaderComponent(props: any) {
  const { column, displayName, enableSorting } = props

  const { sortingOrder } = column.getColDef()
  const sort = column.getSort() || null
  const sortIndex = sortingOrder.indexOf(sort)

  const nextSort = useMemo(() => {
    if (sortIndex === -1) return null
    return sortIndex < sortingOrder.length - 1
      ? sortingOrder[sortIndex + 1]
      : sortingOrder[0]
  }, [sortIndex, sortingOrder])

  return (
    <div className="group flex items-center justify-between break-words">
      <Typography
        className={cx('inline-flex items-center', {
          'cursor-pointer gap-2': !!enableSorting,
        })}
        onClick={() => {
          props.setSort(nextSort)
        }}
      >
        {displayName}
        {!!enableSorting && sort && (
          <Typography component="span">
            {sort === 'asc' ? <FaSortUp /> : <FaSortDown />}
          </Typography>
        )}
        {!!enableSorting && !sort && (
          <Typography component="span">
            <FaSort />
          </Typography>
        )}
      </Typography>
    </div>
  )
}

function AgHeaderGroupComponent(props: any) {
  return <Typography component="span">{props.displayName}</Typography>
}

function AgTextCellRenderer(props: any) {
  const Tooltip = props.colDef.tooltip ? MuiTooltip : Fragment
  return (
    <Tooltip enterDelay={300} placement="top-start" title={props.value}>
      <Typography component="span">
        {props.data.isSkeleton ? (
          <Skeleton className="inline-block w-full" />
        ) : (
          props.value
        )}
      </Typography>
    </Tooltip>
  )
}

function AgDateCellRenderer(props: any) {
  return (
    !!props.value && (
      <Typography component="span">
        {dayjs(props.value).format('DD/MM/YYYY')}
      </Typography>
    )
  )
}

export default function Table(props: AgGridReactProps) {
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
        enableCellTextSelection={true}
        enableRtl={i18n.dir === 'rtl'}
        pagination={enablePagination}
        paginationPageSize={pagination.rowsPerPage + collapsedRows.length}
        rowData={results}
        sortingOrder={['asc']}
        stopEditingWhenCellsLoseFocus={true}
        suppressAnimationFrame={true}
        suppressCellFocus={true}
        suppressDragLeaveHidesColumns={true}
        suppressLoadingOverlay={true}
        suppressMovableColumns={true}
        suppressMultiSort={true}
        suppressPaginationPanel={true}
        suppressRowClickSelection={true}
        suppressRowHoverHighlight={true}
        components={{
          agColumnHeader: AgHeaderComponent,
          agColumnHeaderGroup: AgHeaderGroupComponent,
          agDateCellEditor: CellDateWidget,
          agDateCellRenderer: AgDateCellRenderer,
          agNumberCellEditor: CellNumberWidget,
          agSelectCellEditor: CellAutocompleteWidget,
          agTextCellEditor: CellTextareaWidget,
          agTextCellRenderer: AgTextCellRenderer,
          ...components,
        }}
        noRowsOverlayComponent={() => {
          return (
            <Typography id="no-rows" component="span">
              No Rows To Show
            </Typography>
          )
        }}
        onFirstDataRendered={(agGrid) => {
          onFirstDataRendered(agGrid)
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

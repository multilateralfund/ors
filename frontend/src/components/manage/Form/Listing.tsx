import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'

import { Divider, List, ListItem } from '@mui/material'
import cx from 'classnames'
import { times } from 'lodash'

import Loading from '@ors/components/theme/Loading/Loading'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'

type ListingProps = {
  Item: React.FC<any>
  ItemProps?: Record<string, any>
  className?: any
  classNameGrid?: string
  enableLoader?: boolean
  enablePagination?: boolean
  loaded?: boolean
  loading?: boolean
  noRowsToShowPlaceholder?: React.ReactNode
  onPaginationChanged?: (page: number, rowsPerPage: number) => void
  paginationPageSize?: number
  rowCount: number
  rowData: Array<any> | null | undefined
}

const Listing = forwardRef(function Listing(props: ListingProps, ref) {
  const {
    Item,
    ItemProps = {},
    className,
    classNameGrid = 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
    enableLoader = true,
    enablePagination = true,
    loaded,
    loading,
    noRowsToShowPlaceholder = 'No rows to show',
    onPaginationChanged,
    paginationPageSize = 50,
    rowCount = 0,
    rowData,
  } = props
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: paginationPageSize,
  })

  const results = useMemo(() => {
    if (!loaded) {
      return times(pagination.rowsPerPage, (num) => {
        return {
          id: num + 1,
          isSkeleton: true,
        }
      })
    }
    return rowData
  }, [rowData, loaded, pagination.rowsPerPage])

  const pages = Math.ceil(rowCount / pagination.rowsPerPage)

  useImperativeHandle(
    ref,
    () => {
      return {
        pagination,
        setPagination,
      }
    },
    [pagination, setPagination],
  )

  return (
    <>
      <List className={className || 'mb-6'} disablePadding>
        {enableLoader && (
          <Loading
            className="bg-mui-box-background/70 !duration-0"
            active={loading}
          />
        )}
        {loaded && !results?.length && (
          <>
            <Divider className="mb-3 w-full" />
            <ListItem className="block w-full py-4 text-center">
              {noRowsToShowPlaceholder}
            </ListItem>
            <Divider className="mt-3 w-full" />
          </>
        )}
        {Item && (
          <div className={cx('auto-fit-100 grid gap-8', classNameGrid)}>
            {results?.map((item, index) => {
              return (
                <Item key={item.id} index={index} item={item} {...ItemProps} />
              )
            })}
          </div>
        )}
      </List>
      {enablePagination && !!pages && pages > 1 && (
        <div className="flex items-center justify-center">
          <Pagination
            className="mb-8 inline-block flex-nowrap rounded-sm"
            count={pages}
            disabled={loading}
            page={pagination.page}
            rowsPerPage={pagination.rowsPerPage}
            siblingCount={1}
            onPaginationChanged={(page) => {
              if (page === pagination.page) return
              setPagination({ ...pagination, page: page || 1 })
              if (onPaginationChanged) {
                onPaginationChanged(page || 1, pagination.rowsPerPage)
              }
            }}
          />
        </div>
      )}
    </>
  )
})

export default Listing

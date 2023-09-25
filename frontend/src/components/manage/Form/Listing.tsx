import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'

import { Button, Divider, List, ListItem, Pagination } from '@mui/material'
import cx from 'classnames'
import { capitalize, times } from 'lodash'

import Loading from '@ors/components/theme/Loading/Loading'

import { IoArrowBack } from '@react-icons/all-files/io5/IoArrowBack'
import { IoArrowForward } from '@react-icons/all-files/io5/IoArrowForward'

type ListingProps = {
  Item: React.FC<any>
  ItemProps?: Record<string, any>
  className?: any
  enableLoader?: boolean
  enablePagination?: boolean
  loaded?: boolean
  loading?: boolean
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
    enableLoader = true,
    enablePagination = true,
    loaded,
    loading,
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
              No rows to show
            </ListItem>
            <Divider className="mt-3 w-full" />
          </>
        )}
        {Item &&
          results?.map((item, index) => {
            return (
              <Item key={item.id} index={index} item={item} {...ItemProps} />
            )
          })}
      </List>
      {enablePagination && !!pages && pages > 1 && (
        <Pagination
          className="mb-8 inline-block flex-nowrap rounded-sm"
          count={pages}
          disabled={loading}
          page={pagination.page}
          siblingCount={1}
          renderItem={(item) => {
            const disabled = loading || item.disabled
            const isEllipsis = ['end-ellipsis', 'start-ellipsis'].includes(
              item.type,
            )

            return (
              <Button
                className={cx(
                  'flex min-w-fit border-collapse gap-2 rounded-none border-y border-r border-solid border-mui-default-border p-3 text-xs leading-none',
                  {
                    'bg-action-highlight': item.selected,
                    'bg-mui-box-background': !item.selected,
                    'border-l': item.type === 'previous',
                    'cursor-default': isEllipsis,
                    'rounded-sm': ['next', 'previous'].includes(item.type),
                    'text-typography-faded': disabled,
                    'text-typography-secondary': !disabled,
                  },
                )}
                disabled={disabled}
                onClick={isEllipsis ? () => {} : item.onClick}
                disableRipple
              >
                {item.type === 'previous' && <IoArrowBack />}
                {['next', 'previous'].includes(item.type) && (
                  <span className="hidden md:inline">
                    {capitalize(item.type)}
                  </span>
                )}
                {item.type === 'page' && item.page}
                {isEllipsis && '...'}
                {item.type === 'next' && <IoArrowForward />}
              </Button>
            )
          }}
          onChange={(event, page) => {
            if (page === pagination.page) return
            setPagination({ ...pagination, page })
            if (onPaginationChanged) {
              onPaginationChanged(page, pagination.rowsPerPage)
            }
          }}
        />
      )}
    </>
  )
})

export default Listing

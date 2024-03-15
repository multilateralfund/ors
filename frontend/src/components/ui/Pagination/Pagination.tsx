import {
  Button,
  Pagination as MuiPagination,
  PaginationProps as MuiPaginationProps,
  capitalize,
} from '@mui/material'
import cx from 'classnames'

import { IoArrowBack, IoArrowForward } from 'react-icons/io5'

type PaginationProps = MuiPaginationProps & {
  loading?: boolean
  onPaginationChanged?: (page?: number, rowsPerPage?: number) => void
  rowsPerPage?: number
}

export function Pagination({
  className,
  count,
  loading,
  onPaginationChanged,
  page,
  rowsPerPage,
  siblingCount,
}: PaginationProps) {
  return (
    <MuiPagination
      className={cx('mb-8 inline-block flex-nowrap rounded-sm', className)}
      count={count}
      disabled={loading}
      page={page}
      siblingCount={siblingCount || 1}
      renderItem={(item) => {
        const disabled = loading || item.disabled
        const isEllipsis = ['end-ellipsis', 'start-ellipsis'].includes(
          item.type,
        )

        return (
          <Button
            className={cx('mx-2 h-8 w-8 min-w-0 rounded-full p-4 text-lg', {
              'bg-mlfs-hlYellowTint': item.selected,
              'bg-mui-box-background': !item.selected,
              'border-l': item.type === 'previous',
              'cursor-default': isEllipsis,
              'text-typography-faded': disabled,
              'text-typography-primary': !disabled,
              'w-auto min-w-fit': ['next', 'previous'].includes(item.type),
            })}
            disabled={disabled}
            onClick={isEllipsis ? () => {} : item.onClick}
            disableRipple
          >
            {item.type === 'previous' && (
              <IoArrowBack className="mr-2" size={18} />
            )}
            {['next', 'previous'].includes(item.type) && (
              <span className="hidden md:inline">{capitalize(item.type)}</span>
            )}
            {item.type === 'page' && item.page}
            {isEllipsis && '...'}
            {item.type === 'next' && (
              <IoArrowForward className="ml-2" size={18} />
            )}
          </Button>
        )
      }}
      onChange={(event, value) => {
        if (value === page) return
        if (onPaginationChanged) {
          onPaginationChanged(value, rowsPerPage)
        }
      }}
    />
  )
}

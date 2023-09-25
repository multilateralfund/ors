import {
  Button,
  Pagination as MuiPagination,
  PaginationProps as MuiPaginationProps,
  capitalize,
} from '@mui/material'
import cx from 'classnames'

import { IoArrowBack } from '@react-icons/all-files/io5/IoArrowBack'
import { IoArrowForward } from '@react-icons/all-files/io5/IoArrowForward'

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
              <span className="hidden md:inline">{capitalize(item.type)}</span>
            )}
            {item.type === 'page' && item.page}
            {isEllipsis && '...'}
            {item.type === 'next' && <IoArrowForward />}
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

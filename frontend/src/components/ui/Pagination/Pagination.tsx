import {
  Button,
  Pagination as MuiPagination,
  PaginationProps as MuiPaginationProps,
} from '@mui/material'
import cx from 'classnames'

import BackArrow from './back-arrow.svg?react' // @ts-ignore
import NextArrow from './next-arrow.svg?react' // @ts-ignore

type PaginationProps = {
  loading?: boolean
  onPaginationChanged?: (page?: number, rowsPerPage?: number) => void
  rowsPerPage?: number
} & MuiPaginationProps

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
      className={cx(
        'mb-8 inline-block flex-nowrap rounded-sm',
        className,
      )}
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
              'with-svg-arrow mx-2 h-8 w-8 min-w-0 rounded-full p-4 text-lg font-normal',
              {
                'bg-mlfs-hlYellow': item.selected,
                'bg-transparent': !item.selected,
                'cursor-default': isEllipsis,
                'opacity-40': disabled,
                'text-primary hover:bg-gray-100':
                  item.type !== 'previous' &&
                  item.type !== 'next' &&
                  !item.selected,
                'text-secondary':
                  item.type === 'previous' || item.type === 'next',
                'w-auto min-w-fit': ['next', 'previous'].includes(item.type),
              },
            )}
            disabled={disabled}
            onClick={isEllipsis ? () => {} : item.onClick}
            disableRipple
          >
            {item.type === 'previous' && <BackArrow className="arrow-prev" />}
            {item.type === 'page' && item.page}
            {isEllipsis && '...'}
            {item.type === 'next' && <NextArrow className="arrow-next" />}
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

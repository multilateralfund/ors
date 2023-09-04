/* eslint-disable react-hooks/rules-of-hooks */
import styled from '@emotion/styled'
import { Chip, IconButton, Skeleton, Tooltip, Typography } from '@mui/material'
import cx from 'classnames'
import { isNumber } from 'lodash'
import resolveConfig from 'tailwindcss/resolveConfig'

import Link from '@ors/components/ui/Link/Link'
import { convertHexToRGBA, getContrastText } from '@ors/helpers/Color/Color'
import useStore from '@ors/store'

import { IoAddCircleOutline } from '@react-icons/all-files/io5/IoAddCircleOutline'
import { IoRemoveCircleSharp } from '@react-icons/all-files/io5/IoRemoveCircleSharp'

const tailwindConfigModule = require('@ors/../tailwind.config')
const tailwindConfig = resolveConfig(tailwindConfigModule)

type GridOptionsProps = {
  collapsedRows: Array<number>
  setCollapsedRows?: any
  statuses: Array<{ code: string; color: string; name: string }>
}

function useGridOptions({
  collapsedRows,
  setCollapsedRows,
  statuses,
}: GridOptionsProps) {
  return {
    columnDefs: [
      {
        cellRenderer: (props: any) => {
          const theme = useStore((state) => state.theme)
          const { maxWidth } = props.colDef
          const rowIndex = props.data.rowIndex
          const isCollapsed = collapsedRows.includes(rowIndex)
          const statusColor =
            statuses.filter((status) => status.name === props.data.status)[0]
              ?.color ||
            tailwindConfig.originalColors[theme.mode].typography.primary

          const StyledLink = styled(Link)(() => ({
            ...(isCollapsed ? { color: `${statusColor} !important` } : {}),
            '&:hover': {
              color: `${statusColor} !important`,
            },
          }))

          const StyledIoAddCircleOutline = styled(IoAddCircleOutline)(() => ({
            path: {
              fill: convertHexToRGBA(statusColor, 0.1),
            },
          }))

          return (
            <Tooltip
              enterDelay={300}
              placement="top-start"
              title={props.data.title}
            >
              {props.data.isSkeleton ? (
                <Typography component="span">
                  <Skeleton className="inline-block w-full" />
                </Typography>
              ) : (
                <span
                  className="ag-cell-custom-value"
                  style={{
                    maxWidth: `calc(${maxWidth}px - 2 * (var(--ag-cell-horizontal-padding) - 1px))`,
                  }}
                >
                  <IconButton
                    className="inline p-0 align-middle ltr:mr-2 rtl:ml-2"
                    aria-label="expand-collapse-row"
                    disableRipple
                    onClick={() => {
                      const newCollapsedRows = [...collapsedRows]
                      if (isCollapsed) {
                        const index = collapsedRows.indexOf(rowIndex)
                        newCollapsedRows.splice(index, 1)
                        setCollapsedRows(newCollapsedRows)
                      } else {
                        newCollapsedRows.push(rowIndex)
                        setCollapsedRows(newCollapsedRows)
                      }
                    }}
                  >
                    {isCollapsed ? (
                      <IoRemoveCircleSharp color={statusColor} size="1rem" />
                    ) : (
                      <StyledIoAddCircleOutline
                        color={statusColor}
                        size="1rem"
                      />
                    )}
                  </IconButton>

                  <StyledLink
                    className={cx(
                      'align-middle text-typography no-underline hover:underline',
                    )}
                    href={`/submissions/${props.data.id}`}
                  >
                    {props.data.title}
                  </StyledLink>
                </span>
              )}
            </Tooltip>
          )
        },
        field: 'title',
        headerName: 'Project Title/Code',
        maxWidth: 400,
        minWidth: 400,
        sortable: true,
      },
      {
        field: 'country',
        headerName: 'Country',
        maxWidth: 140,
        minWidth: 140,
        sortable: true,
      },
      {
        field: 'agency',
        headerName: 'Agency',
        maxWidth: 120,
        minWidth: 120,
        sortable: true,
      },
      {
        field: 'sector',
        headerName: 'Sector',
        maxWidth: 120,
        minWidth: 120,
        sortable: true,
      },
      {
        field: 'subsector',
        headerName: 'Subsector',
        initialHide: true,
        maxWidth: 200,
        minWidth: 200,
        sortable: true,
      },
      {
        field: 'project_type',
        headerName: 'Type',
        maxWidth: 100,
        minWidth: 100,
        sortable: true,
      },
      {
        field: 'substance_type',
        headerName: 'HFC/HCFC',
        initialHide: true,
        maxWidth: 140,
        minWidth: 140,
        sortable: true,
      },
      {
        cellRenderer: (props: any) => {
          const funds = parseFloat(props.data.submission?.funds_allocated)
          const value =
            !isNaN(funds) && isNumber(funds) ? funds.toLocaleString() : '-'

          return (
            <Tooltip enterDelay={300} placement="top-start" title={value}>
              <Typography className="text-primary" component="span">
                {props.data.isSkeleton ? (
                  <Skeleton className="inline-block w-full" />
                ) : (
                  value
                )}
              </Typography>
            </Tooltip>
          )
        },
        field: 'submission',
        headerName: 'Funds requested',
        initialHide: true,
        minWidth: 120,
        sortable: true,
      },
      {
        field: 'approval_meeting_no',
        headerName: 'Mtg',
        initialHide: true,
        minWidth: 100,
        sortable: true,
      },
      {
        cellRenderer: (props: any) => {
          const theme = useStore((state) => state.theme)
          const statusColor =
            statuses.filter((status) => status.name === props.data.status)[0]
              ?.color ||
            tailwindConfig.originalColors[theme.mode].typography.primary

          return (
            <Typography component="span">
              {props.data.isSkeleton ? (
                <Skeleton className="inline-block w-full" />
              ) : (
                <Tooltip
                  enterDelay={300}
                  placement="top-start"
                  title={props.value}
                >
                  <Chip
                    label={props.value}
                    size="small"
                    style={{
                      backgroundColor: statusColor,
                      color: getContrastText({
                        background: statusColor,
                        dark: tailwindConfig.originalColors.dark.typography
                          .primary,
                        light:
                          tailwindConfig.originalColors.light.typography
                            .primary,
                      }),
                    }}
                  />
                </Tooltip>
              )}
            </Typography>
          )
        },
        field: 'status',
        headerName: 'Status',
        minWidth: 160,
        sortable: true,
      },
    ],
  }
}

export default useGridOptions

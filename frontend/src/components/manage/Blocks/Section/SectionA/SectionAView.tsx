// import { useRef, useState } from 'react'
import { useRef } from 'react'

import {
  // Box,
  Button,
  ButtonProps,
  Divider,
  ListItem,
  Typography,
} from '@mui/material'
import cx from 'classnames'
// import dayjs from 'dayjs'
// import { isNaN, isNull, isNumber, isUndefined } from 'lodash'
import { isUndefined } from 'lodash'

// import Listing from '@ors/components/manage/Form/Listing'
import Table from '@ors/components/manage/Form/Table'
import { getResults } from '@ors/helpers/Api/Api'

import useGridOptions from './schemaView'

import { IoCaretDown } from '@react-icons/all-files/io5/IoCaretDown'
import { IoCaretUp } from '@react-icons/all-files/io5/IoCaretUp'

// function parseNumber(number: any) {
//   const parsedNumber = parseFloat(number)
//   return isNull(number) || isNaN(number) || !isNumber(number)
//     ? '-'
//     : parsedNumber.toFixed(2)
// }

// function parseDate(date: any) {
//   const value = dayjs(date).format('YYYY-MM-DD')
//   return value !== 'Invalid Date' ? value : '-'
// }

function IconButton({
  active,
  className,
  ...rest
}: ButtonProps & { active?: boolean }) {
  const isActive = isUndefined(active) || !!active

  return (
    <Button
      className={cx(
        'min-w-fit rounded-sm border border-solid border-mui-default-border p-[6px] hover:border-typography',
        {
          'bg-action-highlight text-typography-secondary': isActive,
          'bg-action-highlight/10 text-typography-faded theme-dark:bg-action-highlight/20':
            !isActive,
        },
        className,
      )}
      {...rest}
    />
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Item({ collapsedRows, display, index, item, setCollapsedRows }: any) {
  const isCollapsed = !!collapsedRows[index]

  return (
    <>
      <ListItem
        className={cx(
          'group flex flex-col items-start hover:bg-gray-50 theme-dark:hover:bg-gray-700/20',
          {
            'bg-gray-50 theme-dark:bg-gray-700/20': display === 'detailed',
            'pt-2': !!index,
          },
        )}
        disablePadding
      >
        {!index && <Divider className="mb-3 w-full" />}
        <div className="listing-row flex items-center gap-2">
          <Typography>{item.chemical_name}</Typography>
          {/* <div>{parseNumber(item.imports)}</div>
          <div>{parseNumber(item.exports)}</div>
          <div>{parseNumber(item.productions)}</div>
          <div>{parseNumber(item.import_quotas)}</div>
          <div>{parseDate(item.banned_date)}</div> */}
          <div className="flex items-center justify-end gap-4">
            <Typography>{item.remarks}</Typography>
            {display === 'simple' && (
              <IconButton
                className={cx('group-hover:block', {
                  'md:hidden': !isCollapsed,
                })}
                size="small"
                onClick={() =>
                  setCollapsedRows(() => ({
                    ...collapsedRows,
                    [index]: !collapsedRows[index],
                  }))
                }
                disableRipple
              >
                {isCollapsed && <IoCaretUp size={10} />}
                {!isCollapsed && <IoCaretDown size={10} />}
              </IconButton>
            )}
          </div>
        </div>
        <Divider className="mt-3 w-full" />
      </ListItem>
    </>
  )
}

export default function SectionAView(props: {
  report: Record<string, Array<any>>
}) {
  const grid = useRef<any>()
  const { report } = props

  const { results } = getResults(report.section_b)

  const gridOptions = useGridOptions()

  return (
    <>
      <Table
        className="three-groups rounded-t-none"
        animateRows={true}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        enableCellChangeFlash={true}
        enablePagination={false}
        gridRef={grid}
        rowData={results}
        suppressCellFocus={false}
        suppressRowHoverHighlight={false}
        withSeparators
      />
    </>
  )
  // const { report } = props
  // const [display, setDisplay] = useState('simple')
  // const [collapsedRows, setCollapsedRows] = useState<Record<string, any>>({})

  // const { count, loaded, results } = getResults(report.section_a)

  // return (
  //   <Box>
  //     <Listing
  //       rowCount={count}
  //       rowData={results}
  //       loaded={loaded}
  //       loading={false}
  //       enablePagination={false}
  //       ItemProps={{ display, collapsedRows, setCollapsedRows }}
  //       Item={Item}
  //     />
  //   </Box>
  // )
}

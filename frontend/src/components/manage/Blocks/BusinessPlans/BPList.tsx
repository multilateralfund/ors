'use client'
import * as React from 'react'
import { useState } from 'react'

import { Pagination } from '@ors/components/ui/Pagination/Pagination'
// import { FiEdit, FiEye } from 'react-icons/fi'
import SimpleList from '@ors/components/ui/SimpleList/SimpleList'
import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

const PLANS_PER_PAGE = 50

// const LoadingSkeleton = ({ rows }: { rows?: number }) => (
//   <>
//     {[...Array(rows ?? 50)].map((_, index) => (
//       <TableRow key={index}>
//         {headCells.map((headCell) => (
//           <TableCell key={headCell.id}>
//             <Skeleton />
//           </TableCell>
//         ))}
//         <TableCell>
//           <Skeleton />
//         </TableCell>
//       </TableRow>
//     ))}
//   </>
// )

// function BPListTable(props: any) {
//   const { data, setPagination, setParams } = props
//
//   const [order, setOrder] = React.useState<Order>('desc')
//   const [orderBy, setOrderBy] = React.useState<'agencyName' | keyof Data>(
//     'year_start',
//   )
//   const [loading, setLoading] = React.useState(false)
//   const rows = data.map((item: any) => {
//     return createData(
//       item.id,
//       item.status,
//       item.year_start,
//       item.year_end,
//       item.agency,
//     )
//   })
//
//   const handleRequestSort = (
//     event: React.MouseEvent<unknown>,
//     property: 'agencyName' | keyof Data,
//   ) => {
//     const isAsc = orderBy === property && order === 'asc'
//     setLoading(true)
//     setPagination((pagination: any) => ({
//       ...pagination,
//       page: 1,
//     }))
//     setParams({
//       offset: 0,
//       ordering: isAsc ? `-${property}` : property,
//     })
//     setOrder(isAsc ? 'desc' : 'asc')
//     setOrderBy(property)
//   }
//
//   const sortedRows = React.useMemo(() => {
//     if (orderBy === 'agencyName') {
//       return rows.sort(
//         (a: { agency: { name: string } }, b: { agency: { name: string } }) => {
//           const nameA = a.agency.name.toLowerCase()
//           const nameB = b.agency.name.toLowerCase()
//           if (nameA < nameB) return order === 'asc' ? -1 : 1
//           if (nameA > nameB) return order === 'asc' ? 1 : -1
//           return 0
//         },
//       )
//     }
//     return rows.sort((a: any, b: any) => {
//       if (a[orderBy as keyof Data] < b[orderBy as keyof Data])
//         return order === 'asc' ? -1 : 1
//       if (a[orderBy as keyof Data] > b[orderBy as keyof Data])
//         return order === 'asc' ? 1 : -1
//       return 0
//     })
//   }, [rows, order, orderBy])
//
//   React.useEffect(() => {
//     setLoading(false)
//   }, [data])
//
//   return (
//     <Box className="SimpleTable px-0 py-2 lg:px-4" sx={{ width: '100%' }}>
//       <TableContainer>
//         <Table aria-labelledby="tableTitle" size="small">
//           <EnhancedTableHead
//             order={order}
//             orderBy={orderBy}
//             rowCount={rows.length}
//             onRequestSort={handleRequestSort}
//           />
//           <TableBody>
//             {loading ? (
//               <LoadingSkeleton rows={sortedRows.length} />
//             ) : (
//               sortedRows.map((row: Data, index: number) => {
//                 const labelId = `cell-${index}`
//                 return (
//                   <TableRow key={row.id} tabIndex={-1}>
//                     <TableCell id={labelId} align="center">
//                       {row.agency.name}
//                     </TableCell>
//                     <TableCell id={labelId} align="center">
//                       {row.status}
//                     </TableCell>
//                     <TableCell id={labelId} align="center">
//                       {row.year_start}
//                     </TableCell>
//                     <TableCell id={labelId} align="center">
//                       {row.year_end}
//                     </TableCell>
//                     <TableCell id={labelId} align="center">
//                       <Typography className="flex items-center justify-center">
//                         <Link
//                           className="text-pretty border-0 p-2 hover:text-secondary"
//                           href={`/business-plans/${row.agency.name}/${row.year_start}/${row.year_end}`}
//                           underline="none"
//                         >
//                           <FiEye size={16} />
//                         </Link>
//                         <span>/</span>
//                         <Link
//                           className="text-pretty border-0 p-2 hover:text-secondary"
//                           href={`/business-plans/${row.agency.name}/${row.year_start}/${row.year_end}/edit`}
//                           underline="none"
//                         >
//                           <FiEdit size={16} />
//                         </Link>
//                       </Typography>
//                     </TableCell>
//                   </TableRow>
//                 )
//               })
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Box>
//   )
// }

function useBPListApi(filters?: any) {
  const { data, loading, setParams } = useApi({
    options: {
      params: {
        ...filters,
        limit: PLANS_PER_PAGE,
        offset: 0,
        ordering: '-year_start',
      },
      withStoreCache: true,
    },
    path: 'api/business-plan/',
  })
  const { count, loaded, results } = getResults(data)
  return { count, data, loaded, loading, results, setParams }
}

export default function BPList() {
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: PLANS_PER_PAGE,
  })

  const { count, results, setParams } = useBPListApi()

  const pages = Math.ceil(count / pagination.rowsPerPage)

  return (
    <div className="relative flex flex-col-reverse gap-6 lg:flex-row lg:gap-4">
      <div className="flex-1 flex flex-col gap-6">
        <SimpleList list={results} />
        {!!pages && pages > 1 && (
          <div className="mt-4 flex items-center justify-center">
            <Pagination
              count={pages}
              page={pagination.page}
              siblingCount={1}
              onPaginationChanged={(page) => {
                setPagination({ ...pagination, page: page || 1 })
                setParams({
                  limit: pagination.rowsPerPage,
                  offset: ((page || 1) - 1) * pagination.rowsPerPage,
                })
              }}
            />
          </div>
        )}
      </div>
      <div>FILTERS</div>
    </div>
  )
}

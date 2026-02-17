import Big from 'big.js'
import { toFormat } from '../../Replenishment/utils'
import useApi from '@ors/hooks/useApi.ts'
import { ApiSummaryOfProjects } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/types.ts'
import { default as TableCell } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/SummaryOfProjectsTableCell.tsx'
import { formatApiUrl, formatDecimalValue } from '@ors/helpers'

const SummaryOfProjectsTotalsRow = (props: { totalsUrl: string }) => {
  const totalsUrl = props.totalsUrl || 'api/summary-of-projects/totals'
  const api = useApi<ApiSummaryOfProjects>({
    path: totalsUrl,
    reactivePath: true,
    options: {
      withStoreCache: false,
    },
  })

  const defaultCounts = {
    projects_count: 0,
    countries_count: 0,
    amounts_in_principle: 0,
    amounts_recommended: 0,
  }

  const counts = api.loaded && api.data ? api.data : defaultCounts

  return (
    <div className="table-row">
      <TableCell>Total</TableCell>
      <TableCell></TableCell>
      <TableCell>{counts.countries_count}</TableCell>
      <TableCell>{counts.projects_count}</TableCell>
      <TableCell>{formatDecimalValue(counts.amounts_recommended)}</TableCell>
      <TableCell>{toFormat(Big(counts.amounts_in_principle), 2)}</TableCell>
    </div>
  )
}

export default SummaryOfProjectsTotalsRow

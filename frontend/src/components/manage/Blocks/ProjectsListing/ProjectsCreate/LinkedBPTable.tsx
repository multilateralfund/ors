import { useMemo, useRef } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import { BPTable } from '@ors/components/manage/Blocks/Table/BusinessPlansTable/BusinessPlansTable'
import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import { useGetYearRanges } from '@ors/components/manage/Blocks/BusinessPlans/useGetYearRanges'
import { useGetActivities } from '@ors/components/manage/Blocks/BusinessPlans/useGetActivities'

import { find, map } from 'lodash'
import { ProjIdentifiers } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { ApiBPActivity } from '@ors/types/api_bp_get'

const ACTIVITIES_PER_PAGE_TABLE = 50

export type LinkedBPTableWrapperProps = Omit<
  LinkedBPTableProps,
  'period' | 'yearRanges'
>

const LinkedBPTableWrapper = (
  props: LinkedBPTableWrapperProps & {
    setBpId: React.Dispatch<React.SetStateAction<number | null>>
  },
) => {
  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)

  const latestEndorsedBpPeriod = find(
    periodOptions,
    ({ status = [] }) => status.length > 0 && status.includes('Endorsed'),
  )

  return (
    yearRanges &&
    yearRanges.length > 0 &&
    (latestEndorsedBpPeriod ? (
      <LinkedBPTable
        {...props}
        period={latestEndorsedBpPeriod}
        yearRanges={yearRanges}
      />
    ) : (
      <p>There is no Endorsed BP</p>
    ))
  )
}

type LinkedBPTableProps = Omit<
  LatestEndorsedBPActivitiesProps,
  'activities'
> & {
  period: ReturnType<typeof useGetBpPeriods>['periodOptions'][0]
  projIdentifiers: ProjIdentifiers
}

const LinkedBPTable = ({
  period,
  projIdentifiers,
  ...rest
}: LinkedBPTableProps) => {
  const filters = {
    bp_status: 'Endorsed',
    year_start: period?.year_start,
    year_end: period?.year_start + 2,
    country_id: projIdentifiers.country,
    agency_id: [
      projIdentifiers.current_agency,
      projIdentifiers.side_agency,
    ].filter((v) => !!v),
    project_cluster_id: projIdentifiers.cluster,
    limit: ACTIVITIES_PER_PAGE_TABLE,
    offset: 0,
  }

  const activities = useGetActivities(filters)
  const { loading, results: foundActivities } = activities

  const bp = useMemo(() => {
    return foundActivities.length > 0 ? foundActivities[0].business_plan : null
  }, [foundActivities])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {bp ? (
        <div>
          Business plan {bp.name} {' - '}
          <span>(Meeting: {bp.meeting_id})</span>
          {bp.decision_id ? <span>(Decision: {bp.decision_id})</span> : null}
        </div>
      ) : null}
      <LatestEndorsedBPActivities
        {...{
          activities,
          filters,
        }}
        {...rest}
      />
    </>
  )
}

type LatestEndorsedBPActivitiesProps = {
  activities: ReturnType<typeof useGetActivities>
  yearRanges: ReturnType<typeof useGetYearRanges>['results']
  bpId: number | null
}

export type LinkableActivity = ApiBPActivity & {
  selected: boolean
}

function LatestEndorsedBPActivities(props: LatestEndorsedBPActivitiesProps) {
  const { activities, yearRanges, bpId, ...rest } = props
  const { results, ...restActivities } = activities

  const formattedResults = useMemo(
    () =>
      map(results, (activity) => ({
        ...activity,
        selected: bpId === activity.id,
      })),
    [results, bpId],
  )

  const form = useRef<HTMLFormElement>(null)

  return (
    <div className="activities flex flex-1 flex-col justify-start gap-6 pt-3">
      <form className="flex flex-col gap-6" ref={form}>
        <BPTable
          results={formattedResults}
          yearRanges={yearRanges}
          bpPerPage={ACTIVITIES_PER_PAGE_TABLE}
          isProjectsSection
          {...rest}
          {...restActivities}
        />
      </form>
    </div>
  )
}

export default LinkedBPTableWrapper

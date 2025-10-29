import type { ApiAgency } from '@ors/@types/api_agencies'
import type { Country } from '@ors/@types/store'

import { useEffect, useMemo, useRef } from 'react'

import { BPTable } from '@ors/components/manage/Blocks/Table/BusinessPlansTable/BusinessPlansTable'
import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import { useGetYearRanges } from '@ors/components/manage/Blocks/BusinessPlans/useGetYearRanges'
import { useGetActivities } from '@ors/components/manage/Blocks/BusinessPlans/useGetActivities'
import {
  BpDataProps,
  ProjectDataProps,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { ApiBPActivity } from '@ors/types/api_bp_get'
import { useStore } from '@ors/store'

import { find, map } from 'lodash'

const ACTIVITIES_PER_PAGE_TABLE = 50

const LinkedBPTableWrapper = (
  props: Omit<ProjectDataProps, 'hasSubmitted'> & {
    bpData: BpDataProps
    onBpDataChange: (bpData: BpDataProps) => void
  },
) => {
  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)

  const latestEndorsedBpPeriod = find(
    periodOptions,
    ({ status = [] }) => status.length > 0 && status.includes('Endorsed'),
  )

  const { cluster, country, agency } = props.projectData.projIdentifiers

  return (
    yearRanges &&
    yearRanges.length > 0 &&
    cluster &&
    country &&
    agency &&
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
}

const LinkedBPTable = ({
  projectData,
  period,
  ...rest
}: LinkedBPTableProps) => {
  const projIdentifiers = projectData.projIdentifiers

  const agencies = useStore((state) => state?.common.agencies_with_all.data)
  const countries = useStore((state) => state?.common.countries.data)

  const allAgenciesAgency =
    agencies.filter((a: ApiAgency) => a.name === 'All agencies')?.[0] ?? null
  const globalCountry =
    countries.filter((c: Country) => c.name === 'Global')?.[0] ?? null

  const filters = {
    bp_status: 'Endorsed',
    year_start: period?.year_start,
    year_end: period?.year_start + 2,
    country_id: [projIdentifiers.country, globalCountry.id],
    agency_id: [projIdentifiers.agency, allAgenciesAgency.id],
    project_cluster_id: projIdentifiers.cluster,
    limit: ACTIVITIES_PER_PAGE_TABLE,
    offset: 0,
  }

  const activities = useGetActivities(filters)
  const { loading: loading2, results: foundActivities } = activities

  const bp = useMemo(() => {
    return foundActivities.length > 0 ? foundActivities[0].business_plan : null
  }, [foundActivities])

  return (
    <>
      {bp && projectData.bpLinking.isLinkedToBP ? (
        <div>
          Business plan {bp.name} {' - '}
          <span>(Meeting: {bp.meeting_number})</span>
          {bp.decision_id ? (
            <span>(Decision: {bp.decision_number})</span>
          ) : null}
        </div>
      ) : null}
      {/* {bp && ( */}
      <LatestEndorsedBPActivities
        {...{
          projectData,
          activities,
          filters,
          loading2,
        }}
        {...rest}
      />
      {/* )} */}
    </>
  )
}

type LatestEndorsedBPActivitiesProps = Omit<
  ProjectDataProps,
  'hasSubmitted'
> & {
  activities: ReturnType<typeof useGetActivities>
  yearRanges: ReturnType<typeof useGetYearRanges>['results']
  bpData: BpDataProps
  onBpDataChange: (bpData: BpDataProps) => void
  loading2?: boolean
}

export type LinkableActivity = ApiBPActivity & {
  selected: boolean
}

function LatestEndorsedBPActivities(props: LatestEndorsedBPActivitiesProps) {
  const {
    activities,
    yearRanges,
    projectData,
    setProjectData,
    bpData,
    onBpDataChange,
    loading2,
    ...rest
  } = props
  const { results, ...restActivities } = activities
  const { bpId, isLinkedToBP } = projectData.bpLinking

  const formattedResults = useMemo(
    () =>
      map(results, (activity) => ({
        ...activity,
        selected: bpId === activity.id,
      })),
    [results, bpId],
  )

  const areActivitiesLoaded = restActivities.loaded

  useEffect(() => {
    const isActivityAvailable = find(results, (result) => result.id === bpId)

    if (areActivitiesLoaded && !isActivityAvailable) {
      setProjectData((prevData) => {
        const { bpLinking } = prevData

        return {
          ...prevData,
          bpLinking: {
            ...bpLinking,
            bpId: null,
          },
        }
      })
    }
  }, [areActivitiesLoaded])

  useEffect(() => {
    if (formattedResults.length === 1 && !bpId) {
      setProjectData((prevData) => {
        const { bpLinking } = prevData

        return {
          ...prevData,
          bpLinking: {
            ...bpLinking,
            bpId: formattedResults[0].id,
          },
        }
      })
    }
    if (onBpDataChange) {
      if (formattedResults.length > 0) {
        setProjectData((prevData) => ({
          ...prevData,
          bpLinking: {
            isLinkedToBP: true,
            bpId: prevData.bpLinking.bpId,
          },
        }))
      }

      onBpDataChange({
        hasBpData: formattedResults.length > 0,
        bpDataLoading: !!loading2,
      })
    }
  }, [formattedResults])

  const form = useRef<HTMLFormElement>(null)

  return (
    <div className="activities flex flex-1 flex-col justify-start gap-6 pt-3">
      <form className="flex flex-col gap-6" ref={form}>
        {isLinkedToBP && (
          <BPTable
            results={formattedResults}
            yearRanges={yearRanges}
            bpPerPage={ACTIVITIES_PER_PAGE_TABLE}
            setProjectData={setProjectData}
            isProjectsSection
            {...rest}
            {...restActivities}
          />
        )}
      </form>
    </div>
  )
}

export default LinkedBPTableWrapper

import { ProjectSubSectorType } from '@ors/types/api_project_subsector'
import { useStore } from '@ors/store'

import { filter, find, keys, reduce, reverse, uniq } from 'lodash'

export const filtersToQueryParams = (filters: any) => {
  const filtersParams = Object.entries(filters).map(
    (filter: any) =>
      encodeURIComponent(filter[0]) + '=' + encodeURIComponent(filter[1]),
  )

  return filtersParams.join('&')
}

export const getAgencyByName = (data: any, agency: string) =>
  data.find((item: any) => item.name === agency)

export const getDecisionOptions = (meeting_id: number) => {
  const bpSlice = useStore((state) => state.businessPlans)
  const decisions = bpSlice.decisions.data
  const formattedDecisions = decisions
    ?.filter((decision: any) => decision.meeting_id === meeting_id)
    ?.map((decision: any) => ({
      label: decision.number.toString(),
      value: decision.id,
      meeting: decision.meeting_id,
    }))

  return reverse(formattedDecisions)
}

export const getCurrentPeriodOption = (
  periodOptions: any[],
  yearStart: string,
) => find(periodOptions, ({ year_start }) => year_start === parseInt(yearStart))

export const getLatestBpYearRange = (periodOptions: any[]) =>
  find(periodOptions, (option) => option.status.length > 0)

export const getCurrentTriennium = () => {
  const currentYear = new Date().getFullYear()
  return currentYear + '-' + (currentYear + 2)
}

export const getDecisionNr = (decision_id: number) => {
  const bpSlice = useStore((state) => state.businessPlans)
  const decisions = bpSlice.decisions.data

  return find(decisions, (option) => option.id === decision_id)?.number
}

export const hasErrors = (rowErrors: any, column: string) => {
  const colsWithErrors = reduce(
    rowErrors,
    (acc: string[], error: any) => [...acc, ...keys(error)],
    [],
  )

  return uniq(colsWithErrors).includes(column)
}

export const filterSubsectors = (subsectors: ProjectSubSectorType[]) =>
  filter(subsectors, (subsector) => !subsector.name.startsWith('Other '))

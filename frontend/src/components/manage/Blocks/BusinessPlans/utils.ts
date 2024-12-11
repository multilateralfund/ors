import { useStore } from '@ors/store'
import { find, reverse } from 'lodash'

export const filtersToQueryParams = (filters: any) => {
  const filtersParams = Object.entries(filters).map(
    (filter: any) =>
      encodeURIComponent(filter[0]) + '=' + encodeURIComponent(filter[1]),
  )

  return filtersParams.join('&')
}

export const getAgencyByName = (commonSlice: any, agency: string) =>
  commonSlice.agencies.data.find((item: any) => item.name === agency)

export const getMeetingOptions = () => {
  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data
  const formattedMeetings = meetings?.map((meeting: any) => ({
    label: meeting.number,
    value: meeting.id,
    year: meeting.date ? new Date(meeting.date).getFullYear() : '-',
  }))

  return reverse(formattedMeetings)
}

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

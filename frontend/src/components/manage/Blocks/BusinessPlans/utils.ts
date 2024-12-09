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

export const getCurrentPeriodOption = (
  periodOptions: any[],
  yearStart: string,
) => find(periodOptions, ({ year_start }) => year_start === parseInt(yearStart))

export const getStartEndYears = (periodOptions: any[], period: string) => {
  const firstPeriod = periodOptions?.[periodOptions.length - 1]?.value
  const lastPeriod = periodOptions?.[0]?.value

  const year_end = period?.split('-')[1] || lastPeriod.split('-')[1]
  const year_start = period?.split('-')[0] || firstPeriod.split('-')[0]

  return [year_start, year_end]
}

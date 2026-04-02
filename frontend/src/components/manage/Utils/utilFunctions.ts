import { useStore } from '@ors/store'
import { find, reverse } from 'lodash'
import { ApiDecision } from '@ors/types/api_meetings.ts'
import useApi from '@ors/hooks/useApi.ts'
import { getResults } from '@ors/helpers'

export const useMeetingOptions = () => {
  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data
  const formattedMeetings = meetings?.map((meeting: any) => ({
    label: meeting.number,
    value: meeting.id.toString(),
    year: meeting.date ? new Date(meeting.date).getFullYear().toString() : '-',
  }))

  return reverse(formattedMeetings)
}

export const useDecisionOptions = (
  meeting_id: number | string | (number | string)[],
) => {
  const { data, ...rest } = useApi<ApiDecision[]>({
    options: {
      withStoreCache: false,
      triggerIf: !!meeting_id,
      params: {
        meeting_id: meeting_id,
      },
    },
    path: 'api/decisions',
  })
  const results = getResults(data)
  const formattedResults =
    results.loaded && results.results
      ? results.results.map((d: ApiDecision) => ({
          name: d.number,
          value: d.id.toString(),
        }))
      : []
  return { ...rest, ...results, results: formattedResults }
}

export const getFilterOptions = (
  filters: any,
  options: any = [],
  filterIdentifier: string,
) => {
  const selectedOptions = filters[filterIdentifier]

  if (!selectedOptions) {
    return options
  }

  const selectedOptionsIds = selectedOptions.map(
    (selectedOption: any) => selectedOption.id,
  )

  return options.filter(
    (option: any) => !selectedOptionsIds.includes(option.id),
  )
}

export const getMeetingNr = (meeting_id?: number) => {
  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data

  return find(meetings, (option) => option.id === meeting_id)?.number
}

export const isOneOf = <T>(
  value: T | null | undefined,
  options: readonly T[],
): value is T => {
  return value != null && options.includes(value as T)
}

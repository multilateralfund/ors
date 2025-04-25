import { useStore } from '@ors/store'
import { find, reverse } from 'lodash'

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

export const getMeetingNr = (meeting_id: number) => {
  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data

  return find(meetings, (option) => option.id === meeting_id)?.number
}

export type MeetingType = {
  id: number
  number: number
  title: string
  status: string
  date: string
  end_date: string | null
}

export type ApiDecision = {
  id: number
  meeting_id: number
  number: string // This is not a mistake, the "number" is a string, usually something like "11/59".
  title: string
}

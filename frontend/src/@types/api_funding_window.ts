import { ApiDecision, MeetingType } from '@ors/types/api_meetings.ts'

export type FundingWindowType = {
  id: number
  meeting: MeetingType
  decision: ApiDecision
  description: string
  amount: string
  remarks: string
  total_project_funding_approved: string
  balance: string
}

export type FundingWindowPostType = {
  meeting_id: number | null
  decision_id: number | null
  description: string
  amount: string
  remarks: string
}

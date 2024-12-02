// Response from /api/replenishment/status-files

export type ApiReplenishmentStatusFile = {
  id: number
  year: number
  meeting_id: number
  comment: string
  filename: string
  uploaded_at: string
  download_url: string
}

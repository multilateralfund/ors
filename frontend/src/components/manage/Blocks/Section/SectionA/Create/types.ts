import { DeserializedDataA } from '@ors/models/SectionA'

export type RowData = DeserializedDataA & {
  count?: number
  display_name?: string
  group?: string
  row_id: string
  rowType: string
  tooltip?: boolean
}

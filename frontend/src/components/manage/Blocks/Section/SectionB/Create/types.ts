import { DeserializedDataB } from '@ors/models/SectionB'

export type RowData = DeserializedDataB & {
  count?: number
  display_name?: string
  group?: string
  row_id: string
  rowType: string
  tooltip?: boolean
}

export type PinnedBottomRowData = {
  display_name?: string
  row_id?: string
  rowType: string
  tooltip?: boolean
}

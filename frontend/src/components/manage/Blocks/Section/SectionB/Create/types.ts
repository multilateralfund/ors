import { DeserializedDataB } from '@ors/models/SectionB'

export type RowData = {
  count?: number
  display_name?: string
  group?: string
  row_id: string
  rowType: string
  tooltip?: boolean
} & DeserializedDataB

export type PinnedBottomRowData = {
  display_name?: string
  row_id?: string
  rowType: string
  tooltip?: boolean
}

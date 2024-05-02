import { DeserializedDataC } from '@ors/models/SectionC'

export type RowData = {
  count?: number
  rowType?: string
  tooltip?: boolean
} & DeserializedDataC

export type SubstancePrice = {
  blend_id: null | number
  current_year_price: string
  previous_year_price: string
  remarks: string
  substance_id: null | number
}
export type SubstancePrices = SubstancePrice[]

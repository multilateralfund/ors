import { AdmRow } from '@ors/types/api_empty-form'

export interface AdmCRowValue {
  column_id: number
  id: number
  row_id: number
  value_choice_id: null | number
  value_text: string
}

export interface AdmCRow extends AdmRow {
  row_id?: string
  rowType?: string
  values: AdmCRowValue[]
}

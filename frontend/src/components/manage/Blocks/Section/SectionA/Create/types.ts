import SectionA, { DeserializedDataA } from '@ors/models/SectionA'

import { IBaseSectionProps } from '../../types'

export type RowData = {
  change_type?: string
  count?: number
  display_name?: string
  group?: string
  row_id: string
  rowType: string
  tooltip?: boolean
} & DeserializedDataA

export interface ISectionACreateProps extends IBaseSectionProps {
  Section: SectionA
}

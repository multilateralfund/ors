import type {
  IBaseSectionCreateProps,
  IBaseSectionViewProps,
  SubstanceRow,
} from '../types'
import type { DeserializedDataA } from '@ors/models/SectionA'
import type SectionA from '@ors/models/SectionA'

export type SectionARowData = Omit<DeserializedDataA, 'mandatory'> &
  SubstanceRow
export interface SectionAViewProps extends IBaseSectionViewProps<SectionA> {}
export interface SectionACreateProps
  extends IBaseSectionCreateProps<SectionA> {}

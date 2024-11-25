import type { DeserializedDataB } from '@ors/models/SectionB'
import type SectionB from '@ors/models/SectionB'

import {
  IBaseSectionCreateProps,
  IBaseSectionViewProps,
  SubstanceRow,
} from '../types'

export type SectionBRowData = Omit<DeserializedDataB, 'mandatory'> &
  SubstanceRow
export interface SectionBViewProps extends IBaseSectionViewProps<SectionB> {}
export interface SectionBCreateProps
  extends IBaseSectionCreateProps<SectionB> {}

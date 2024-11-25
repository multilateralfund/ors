import type { DeserializedDataC } from '@ors/models/SectionC'
import type SectionC from '@ors/models/SectionC'

import {
  IBaseSectionCreateProps,
  IBaseSectionViewProps,
  SubstanceRow,
} from '../types'

export type SectionCRowData = Omit<DeserializedDataC, 'mandatory'> &
  SubstanceRow
export interface SectionCViewProps extends IBaseSectionViewProps<SectionC> {}
export interface SectionCCreateProps
  extends IBaseSectionCreateProps<SectionC> {}

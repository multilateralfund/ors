import SectionF from '@ors/models/SectionF'

import {
  IBaseSectionCreateProps,
  IBaseSectionEditProps,
  IBaseSectionViewProps,
} from '../types'

export interface SectionFViewProps extends IBaseSectionViewProps<SectionF> {}

export interface SectionFCreateProps
  extends IBaseSectionCreateProps<SectionF> {}

export interface SectionFEditProps extends IBaseSectionEditProps<SectionF> {}

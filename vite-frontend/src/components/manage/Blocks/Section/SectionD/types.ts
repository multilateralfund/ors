import type { CPRowData } from '@ors/components/manage/Blocks/CountryProgramme/types'
import type { SectionDFormFields } from '@ors/models/SectionD'
import type SectionD from '@ors/models/SectionD'

import { IBaseSectionCreateProps, IBaseSectionViewProps } from '../types'

export type SectionDRowData = CPRowData & SectionDFormFields
export interface SectionDViewProps extends IBaseSectionViewProps<SectionD> {}
export interface SectionDCreateProps
  extends IBaseSectionCreateProps<SectionD> {}

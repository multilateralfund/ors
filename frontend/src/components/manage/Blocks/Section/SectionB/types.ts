import type { CPRowData } from '@ors/components/manage/Blocks/CountryProgramme/types'
import type { SectionBFormFields } from '@ors/models/SectionB'
import type SectionB from '@ors/models/SectionB'

import { IBaseSectionProps } from '../types'

export type SectionBRowData = CPRowData & SectionBFormFields
export interface ISectionBCreateProps extends IBaseSectionProps<SectionB> {}

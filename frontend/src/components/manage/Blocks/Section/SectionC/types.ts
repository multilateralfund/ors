import type { CPRowData } from '@ors/components/manage/Blocks/CountryProgramme/types'
import type { SectionCFormFields } from '@ors/models/SectionC'
import type SectionC from '@ors/models/SectionC'

import { IBaseSectionProps } from '../types'

export type SectionCRowData = CPRowData & SectionCFormFields
export interface ISectionCCreateProps extends IBaseSectionProps<SectionC> {}

import type { IBaseSectionProps } from '../types'
import type { CPRowData } from '@ors/components/manage/Blocks/CountryProgramme/types'
import type { DeserializedDataA } from '@ors/models/SectionA'
import type SectionA from '@ors/models/SectionA'

export type SectionARowData = CPRowData & DeserializedDataA
export interface ISectionACreateProps extends IBaseSectionProps<SectionA> {}

import type { CPRowData } from '@ors/components/manage/Blocks/CountryProgramme/types'

import SectionE, { SectionEFormFields } from '@ors/models/SectionE'

import { IBaseSectionCreateProps, IBaseSectionViewProps } from '../types'

export type SectionERowData = CPRowData & SectionEFormFields
export interface SectionEViewProps extends IBaseSectionViewProps<SectionE> {}
export interface SectionECreateProps
  extends IBaseSectionCreateProps<SectionE> {}

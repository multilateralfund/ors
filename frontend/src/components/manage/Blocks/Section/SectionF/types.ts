import SectionF from '@ors/models/SectionF'

import { CPCommentsForEditType } from '../../CountryProgramme/CPCommentsTypes'
import { CPEditForm } from '../../CountryProgramme/typesCPCreate'
import { IBaseSectionProps } from '../types'

export interface ISectionFCreateProps extends IBaseSectionProps {
  Section: SectionF
}

export interface ISectionFEditProps
  extends Omit<ISectionFCreateProps, 'form' | 'setForm'> {
  Comments: CPCommentsForEditType
  form: CPEditForm
  setForm: React.Dispatch<React.SetStateAction<CPEditForm>>
}

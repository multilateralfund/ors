import { CPCommentsForEditType } from '@ors/components/manage/Blocks/CountryProgramme/CPCommentsTypes'
import { CPEditForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'

import { ISectionDCreateProps } from '../Create/types'

export interface ISectionDEditProps
  extends Omit<ISectionDCreateProps, 'form' | 'setForm'> {
  Comments: CPCommentsForEditType
  form: CPEditForm
  setForm: React.Dispatch<React.SetStateAction<CPEditForm>>
}

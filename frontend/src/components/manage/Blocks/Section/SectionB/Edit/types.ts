import { CPCommentsForEditType } from '@ors/components/manage/Blocks/CountryProgramme/CPCommentsTypes'
import { CPEditForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'

import { ISectionBCreateProps } from '../Create/types'

export interface ISectionBEditProps
  extends Omit<ISectionBCreateProps, 'form' | 'setForm'> {
  Comments: CPCommentsForEditType
  form: CPEditForm
  setForm: React.Dispatch<React.SetStateAction<CPEditForm>>
}

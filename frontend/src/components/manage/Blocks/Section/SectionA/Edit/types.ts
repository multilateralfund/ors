import { CPCommentsForEditType } from '@ors/components/manage/Blocks/CountryProgramme/CPCommentsTypes'
import { CPEditForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'

import { ISectionACreateProps } from '../Create/types'

export interface ISectionAEditProps
  extends Omit<ISectionACreateProps, 'form' | 'setForm'> {
  Comments: CPCommentsForEditType
  form: CPEditForm
  setForm: React.Dispatch<React.SetStateAction<CPEditForm>>
}

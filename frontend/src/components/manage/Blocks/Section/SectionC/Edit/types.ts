import { CPCommentsForEditType } from '@ors/components/manage/Blocks/CountryProgramme/CPCommentsTypes'
import { CPEditForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'

import { ISectionCCreateProps } from '../Create/types'

export interface ISectionCEditProps
  extends Omit<ISectionCCreateProps, 'form' | 'setForm'> {
  Comments: CPCommentsForEditType
  form: CPEditForm
  setForm: React.Dispatch<React.SetStateAction<CPEditForm>>
}

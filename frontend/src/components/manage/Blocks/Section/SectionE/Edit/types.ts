import { CPCommentsForEditType } from '@ors/components/manage/Blocks/CountryProgramme/CPCommentsTypes'
import { CPEditForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'

import { ISectionECreateProps } from '../Create/types'

export interface ISectionEEditProps
  extends Omit<ISectionECreateProps, 'form' | 'setForm'> {
  Comments: CPCommentsForEditType
  form: CPEditForm
  setForm: React.Dispatch<React.SetStateAction<CPEditForm>>
}

import type { CPEditForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'

import { DispatchWithLocalStorage } from './types'

export type CPCommentState = {
  country: string
  mlfs: string
}

export type CPCommentsProps = {
  section: string
  viewOnly: boolean
}

export type CPCommentsType = React.FC<CPCommentsProps>

export type CPCommentsForEditProps = {
  form: CPEditForm
  section: string
  setForm: DispatchWithLocalStorage<React.SetStateAction<CPEditForm>>
}

export type CPCommentsForEditType = React.FC<CPCommentsForEditProps>

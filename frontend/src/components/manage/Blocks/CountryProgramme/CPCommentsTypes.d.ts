import type { CPBaseForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'

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
  form: CPBaseForm
  section: string
  setForm: React.Dispatch<React.SetStateAction<CPBaseForm>>
}

export type CPCommentsForEditType = React.FC<CPCommentsForEditProps>

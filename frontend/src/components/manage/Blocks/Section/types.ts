import { EmptyFormType } from '@ors/types/api_empty-form'
import { ReportVariant } from '@ors/types/variants'

import { CPCommentsForEditType } from '../CountryProgramme/CPCommentsTypes'
import { SectionMeta } from '../CountryProgramme/types'
import {
  CPBaseForm,
  CPEditForm,
  PassedCPCreateTableProps,
} from '../CountryProgramme/typesCPCreate'

export interface IBaseSectionProps<T> {
  Section: T
  TableProps: PassedCPCreateTableProps
  emptyForm: EmptyFormType
  form: CPBaseForm
  onSectionCheckChange: (section: string, isChecked: boolean) => void
  section: SectionMeta
  sectionsChecked: Record<string, boolean>
  setForm: React.Dispatch<React.SetStateAction<CPBaseForm>>
  variant: ReportVariant
}

export interface IBaseSectionEditProps<T>
  extends Omit<IBaseSectionProps<T>, 'form' | 'setForm'> {
  Comments: CPCommentsForEditType
  form: CPEditForm
  setForm: React.Dispatch<React.SetStateAction<CPEditForm>>
  showComments: boolean
}

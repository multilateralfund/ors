import { EmptyFormType } from '@ors/types/api_empty-form'
import { ReportVariant } from '@ors/types/variants'

import { SectionMeta } from '../CountryProgramme/types'
import {
  CPBaseForm,
  PassedCPCreateTableProps,
} from '../CountryProgramme/typesCPCreate'

export interface IBaseSectionProps {
  TableProps: PassedCPCreateTableProps
  emptyForm: EmptyFormType
  form: CPBaseForm
  onSectionCheckChange: (section: string, isChecked: boolean) => void
  section: SectionMeta
  sectionsChecked: Record<string, boolean>
  setForm: React.Dispatch<React.SetStateAction<CPBaseForm>>
  variant: ReportVariant
}

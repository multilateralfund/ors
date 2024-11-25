import type { CPRowData } from '@ors/components/manage/Blocks/CountryProgramme/types'
import type { CPReport } from '@ors/types/api_country-programme_records'
import type { EmptyFormType } from '@ors/types/api_empty-form'
import type { ReportVariant } from '@ors/types/variants'

import {
  CPCommentsForEditType,
  CPCommentsType,
} from '../CountryProgramme/CPCommentsTypes'
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
  onSectionCheckChange: (section: string, isChecked: boolean) => void
  section: SectionMeta
  sectionsChecked: Record<string, boolean>
  variant: ReportVariant
}

export interface IBaseSectionCreateProps<T> extends IBaseSectionProps<T> {
  form: CPBaseForm
  setForm: React.Dispatch<React.SetStateAction<CPBaseForm>>
}

export interface IBaseSectionEditProps<T> extends IBaseSectionProps<T> {
  Comments: CPCommentsForEditType
  form: CPEditForm
  setForm: React.Dispatch<React.SetStateAction<CPEditForm>>
  showComments: boolean
}

export interface IBaseSectionViewProps<T> extends IBaseSectionProps<T> {
  Comments: CPCommentsType
  report: CPReport
  showComments: boolean
}

export type PinnedBottomRowData = {
  display_name: string
  row_id: string
  rowType: string
  tooltip: boolean
}

export interface SubstanceRow extends CPRowData {
  mandatory?: boolean
}

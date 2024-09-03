import type { TableProps } from '@ors/components/manage/Form/Table'
import { CPReport } from '@ors/types/api_country-programme_records'
import { ReportVariant } from '@ors/types/variants'

import React from 'react'

import SectionA from '@ors/models/SectionA'
import SectionB from '@ors/models/SectionB'
import SectionC from '@ors/models/SectionC'
import SectionD from '@ors/models/SectionD'
import SectionE from '@ors/models/SectionE'
import SectionF from '@ors/models/SectionF'

import { CPCommentState } from './CPCommentsTypes'
import { SectionMeta } from './types'

type ToolbarProps = {
  enterFullScreen: () => void
  exitFullScreen: () => void
  fullScreen: boolean
  isActiveSection: boolean
  section: SectionMeta
}
export interface WidgetCountry {
  id: number
  label: string
}

export interface WidgetYear {
  id: number
  label: string
}

type FormError = Record<string, string>
export type FormErrors = Record<string, FormError>
export interface CPCreateTableProps extends TableProps {
  Toolbar: React.FC<ToolbarProps>
  enableCellChangeFlash: boolean
  enableFullScreen: boolean
  enablePagination: boolean
  // getRowId: (props: any) => string
  rowsVisible: number
  suppressCellFocus: boolean
  suppressColumnVirtualisation: boolean
  suppressLoadingOverlay: boolean
  suppressRowHoverHighlight: boolean
  withSeparators: boolean
}

export interface PassedCPCreateTableProps extends CPCreateTableProps {
  context: {
    section:
      | SectionA['data']
      | SectionB['data']
      | SectionC['data']
      | SectionD['data']
      | SectionE['data']
      | SectionF['data']
    showComments: boolean
    variant: ReportVariant
  }
  errors: FormErrors
  report: Report
  section:
    | SectionA['data']
    | SectionB['data']
    | SectionC['data']
    | SectionD['data']
    | SectionE['data']
    | SectionF['data']
}

export interface CPBaseForm {
  country: WidgetCountry | null
  files: File[]
  report_info: {
    reported_section_a: boolean
    reported_section_b: boolean
    reported_section_c: boolean
    reported_section_d: boolean
    reported_section_e: boolean
    reported_section_f: boolean
    reporting_email: null | string
    reporting_entry: null | string
  }
  section_a: SectionA['data']
  section_b: SectionB['data']
  section_c: SectionC['data']
  section_d: SectionD['data']
  section_e: SectionE['data']
  section_f: SectionF['data']
  year: number
}

export interface CPEditForm extends Omit<CPBaseForm, 'country' | 'year'> {
  adm_b: CPReport['adm_b']
  adm_c: CPReport['adm_c']
  adm_d: CPReport['adm_d']
  comments_section_a?: CPCommentState
  comments_section_b?: CPCommentState
  comments_section_c?: CPCommentState
  comments_section_d?: CPCommentState
  comments_section_e?: CPCommentState
  comments_section_f?: CPCommentState
}

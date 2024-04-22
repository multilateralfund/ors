import type { TableProps } from '@ors/components/manage/Form/Table'
import { ReportVariant } from '@ors/types/variants'

import React from 'react'

import SectionA from '@ors/models/SectionA'
import SectionB from '@ors/models/SectionB'
import SectionC from '@ors/models/SectionC'
import SectionD from '@ors/models/SectionD'
import SectionE from '@ors/models/SectionE'
import SectionF from '@ors/models/SectionF'

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
  report_info: {
    reported_section_a: boolean
    reported_section_b: boolean
    reported_section_c: boolean
    reported_section_d: boolean
    reported_section_e: boolean
    reported_section_f: boolean
    reporting_email: string
    reporting_entry: string
  }
  section_a: SectionA['data']
  section_b: SectionB['data']
  section_c: SectionC['data']
  section_d: SectionD['data']
  section_e: SectionE['data']
  section_f: SectionF['data']
  year: number
}

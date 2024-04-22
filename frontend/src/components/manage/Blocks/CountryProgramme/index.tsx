import { ConstantsType } from '@ors/types/variants'

import { filter, includes } from 'lodash'

import AdmBCreate from '@ors/components/manage/Blocks/Section/AdmB/Create/Create'
import AdmBView from '@ors/components/manage/Blocks/Section/AdmB/View/View'
import AdmCCreate from '@ors/components/manage/Blocks/Section/AdmC/Create/Create'
import AdmCView from '@ors/components/manage/Blocks/Section/AdmC/View/View'
import AdmDCreate from '@ors/components/manage/Blocks/Section/AdmD/Create/Create'
import AdmDView from '@ors/components/manage/Blocks/Section/AdmD/View/View'
import ReportInfoCreate from '@ors/components/manage/Blocks/Section/ReportInfo/Create/Create'
import ReportInfoView from '@ors/components/manage/Blocks/Section/ReportInfo/View/View'
import SectionACreate from '@ors/components/manage/Blocks/Section/SectionA/Create/Create'
import SectionAView from '@ors/components/manage/Blocks/Section/SectionA/View/View'
import SectionBCreate from '@ors/components/manage/Blocks/Section/SectionB/Create/Create'
import SectionBView from '@ors/components/manage/Blocks/Section/SectionB/View/View'
import SectionCCreate from '@ors/components/manage/Blocks/Section/SectionC/Create/Create'
import SectionCView from '@ors/components/manage/Blocks/Section/SectionC/View/View'
import SectionDCreate from '@ors/components/manage/Blocks/Section/SectionD/Create/Create'
import SectionDView from '@ors/components/manage/Blocks/Section/SectionD/View/View'
import SectionECreate from '@ors/components/manage/Blocks/Section/SectionE/Create/Create'
import SectionEView from '@ors/components/manage/Blocks/Section/SectionE/View/View'
import SectionFCreate from '@ors/components/manage/Blocks/Section/SectionF/Create'
import SectionFView from '@ors/components/manage/Blocks/Section/SectionF/View'

import { DefaultComponentType, SectionMeta } from './types'

const constants: ConstantsType = {
  I: undefined,
  II: {
    adm_d: {
      title: 'D. Qualitative assessment of the operation of RMP/NPP/TPMP',
    },
    section_a: {
      label: 'Datasheet',
    },
    section_c: {
      label: 'Adm C prices',
      title:
        'AVERAGE ESTIMATED PRICE OF HCFCs, HFCs AND ALTERNATIVES (US $/kg)',
    },
  },
  III: {
    section_a: {
      label: 'Datasheet',
    },
    section_c: {
      label: 'Adm C prices',
      title:
        'AVERAGE ESTIMATED PRICE OF HCFCs, HFCs AND ALTERNATIVES (US $/kg)',
    },
  },
  IV: {
    section_a: {
      title:
        'SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)',
    },
  },
  V: {
    section_a: {
      title:
        'SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)',
    },
  },
}

export type ComponentsCreate = {
  adm_b?: DefaultComponentType
  adm_c?: DefaultComponentType
  adm_d?: DefaultComponentType
  report_info: typeof ReportInfoCreate
  section_a: typeof SectionACreate
  section_b: typeof SectionBCreate
  section_c: typeof SectionCCreate
  section_d: typeof SectionDCreate
  section_e: typeof SectionECreate
  section_f: typeof SectionFCreate
}

type ComponentsView = {
  adm_b: typeof AdmBView
  adm_c: typeof AdmCView
  adm_d: typeof AdmDView
  report_info: typeof ReportInfoView
  section_a: typeof SectionAView
  section_b: typeof SectionBView
  section_c: typeof SectionCView
  section_d: typeof SectionDView
  section_e: typeof SectionEView
  section_f: typeof SectionFView
}

type ComponentsEdit = {
  adm_b: typeof AdmBCreate
  adm_c: typeof AdmCCreate
  adm_d: typeof AdmDCreate
  report_info: typeof ReportInfoCreate
  section_a: typeof SectionACreate
  section_b: typeof SectionBCreate
  section_c: typeof SectionCCreate
  section_d: typeof SectionDCreate
  section_e: typeof SectionECreate
  section_f: typeof SectionFCreate
}

const components: {
  create: ComponentsCreate
  edit: ComponentsEdit
  view: ComponentsView
} = {
  create: {
    report_info: ReportInfoCreate,
    section_a: SectionACreate,
    section_b: SectionBCreate,
    section_c: SectionCCreate,
    section_d: SectionDCreate,
    section_e: SectionECreate,
    section_f: SectionFCreate,
  },
  edit: {
    adm_b: AdmBCreate,
    adm_c: AdmCCreate,
    adm_d: AdmDCreate,
    report_info: ReportInfoCreate,
    section_a: SectionACreate,
    section_b: SectionBCreate,
    section_c: SectionCCreate,
    section_d: SectionDCreate,
    section_e: SectionECreate,
    section_f: SectionFCreate,
  },
  view: {
    adm_b: AdmBView,
    adm_c: AdmCView,
    adm_d: AdmDView,
    report_info: ReportInfoView,
    section_a: SectionAView,
    section_b: SectionBView,
    section_c: SectionCView,
    section_d: SectionDView,
    section_e: SectionEView,
    section_f: SectionFView,
  },
}

const DefaultComponent = () => <div>Not implemented</div>

export function getSections(
  variant: {
    maxYear: number
    minYear: number
    model: keyof ConstantsType
  },
  mode: keyof typeof components = 'view',
): SectionMeta[] {
  const { model } = variant
  const ids = [
    ...((includes(['I', 'II', 'III', 'IV', 'V'], model) && ['section_a']) ||
      []),
    ...((includes(['II', 'III', 'IV', 'V'], model) && ['section_c']) || []),
    ...((includes(['IV', 'V'], model) && [
      'section_b',
      'section_d',
      'section_e',
      'section_f',
    ]) ||
      []),
    ...((includes(['II', 'III'], model) && ['adm_b', 'adm_c', 'adm_d']) || []),
    ...((model === 'V' && ['report_info']) || []),
  ]

  return filter(
    [
      {
        id: 'report_info',
        component: components[mode].report_info || DefaultComponent,
        label: 'Report Info',
        panelId: 'report-info-panel',
        title: 'Report information and status',
      },
      {
        id: 'section_a',
        allowFullScreen: true,
        component: components[mode].section_a || DefaultComponent,
        label: constants[model]?.section_a?.label || 'Section A',
        panelId: 'section-A-panel',
        title:
          constants[model]?.section_a?.title ||
          'A. Data on Controlled Substances (in METRIC TONNES)',
      },
      {
        id: 'adm_b',
        allowFullScreen: true,
        component: components[mode].adm_b || DefaultComponent,
        label: 'Adm B',
        panelId: 'adm-B-panel',
        title: 'B. Regulatory, administrative and supportive actions',
      },
      {
        id: 'section_b',
        allowFullScreen: true,
        component: components[mode].section_b || DefaultComponent,
        label: 'Section B',
        panelId: 'section-B-panel',
        title:
          'SECTION B. ANNEX F - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)',
      },
      {
        id: 'adm_c',
        allowFullScreen: true,
        component: components[mode].adm_c || DefaultComponent,
        label: 'Adm C',
        panelId: 'adm-C-panel',
        title: 'C. Quantitative assessment of the phase-out programme',
      },
      {
        id: 'section_c',
        allowFullScreen: true,
        component: components[mode].section_c || DefaultComponent,
        label: constants[model]?.section_c?.label || 'Section C',
        panelId: 'section-C-panel',
        title:
          constants[model]?.section_c?.title ||
          'SECTION C. AVERAGE ESTIMATED PRICE OF HCFCs, HFCs AND ALTERNATIVES (US $/kg)',
      },
      {
        id: 'adm_d',
        component: components[mode].adm_d || DefaultComponent,
        label: 'Adm D-E',
        panelId: 'adm-D-panel',
        title:
          constants[model]?.adm_d?.title ||
          'D. Qualitative assessment of the operation of HPMP',
      },
      {
        id: 'section_d',
        allowFullScreen: true,
        component: components[mode].section_d || DefaultComponent,
        label: 'Section D',
        note: 'NOTE:  Fill in this form only if your country generated HFC-23 from any facility that produced (manufactured) Annex C Group I or Annex F substances',
        panelId: 'section-D-panel',
        title:
          'SECTION D. ANNEX F, GROUP II - DATA ON HFC-23 GENERATION (METRIC TONNES)',
      },
      {
        id: 'section_e',
        allowFullScreen: true,
        component: components[mode].section_e || DefaultComponent,
        label: 'Section E',
        note: 'NOTE:  Columns shaded in grey are voluntary',
        panelId: 'section-E-panel',
        title:
          'SECTION E. ANNEX F, GROUP II - DATA ON HFC-23 EMISSIONS (METRIC TONNES)',
      },
      {
        id: 'section_f',
        component: components[mode].section_f || DefaultComponent,
        label: 'Section F',
        panelId: 'section-F-panel',
        title: 'SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES',
      },
    ],
    (section) => includes(ids, section.id),
  )
}

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
import SectionAEdit from '@ors/components/manage/Blocks/Section/SectionA/Edit/Edit'
import SectionAView from '@ors/components/manage/Blocks/Section/SectionA/View/View'
import SectionAViewDiff from '@ors/components/manage/Blocks/Section/SectionA/ViewDiff/View'
import SectionBCreate from '@ors/components/manage/Blocks/Section/SectionB/Create/Create'
import SectionBEdit from '@ors/components/manage/Blocks/Section/SectionB/Edit/Edit'
import SectionBView from '@ors/components/manage/Blocks/Section/SectionB/View/View'
import SectionBViewDiff from '@ors/components/manage/Blocks/Section/SectionB/ViewDiff/View'
import SectionCCreate from '@ors/components/manage/Blocks/Section/SectionC/Create/Create'
import SectionCEdit from '@ors/components/manage/Blocks/Section/SectionC/Edit/Edit'
import SectionCView from '@ors/components/manage/Blocks/Section/SectionC/View/View'
import SectionCViewDiff from '@ors/components/manage/Blocks/Section/SectionC/ViewDiff/View'
import SectionDCreate from '@ors/components/manage/Blocks/Section/SectionD/Create/Create'
import SectionDEdit from '@ors/components/manage/Blocks/Section/SectionD/Edit/Edit'
import SectionDView from '@ors/components/manage/Blocks/Section/SectionD/View/View'
import SectionDViewDiff from '@ors/components/manage/Blocks/Section/SectionD/ViewDiff/View'
import SectionECreate from '@ors/components/manage/Blocks/Section/SectionE/Create/Create'
import SectionEEdit from '@ors/components/manage/Blocks/Section/SectionE/Edit/Edit'
import SectionEView from '@ors/components/manage/Blocks/Section/SectionE/View/View'
import SectionEViewDiff from '@ors/components/manage/Blocks/Section/SectionE/ViewDiff/View'
import SectionFCreate from '@ors/components/manage/Blocks/Section/SectionF/Create'
import SectionFEdit from '@ors/components/manage/Blocks/Section/SectionF/Edit'
import SectionFView from '@ors/components/manage/Blocks/Section/SectionF/View'
import SectionFViewDiff from '@ors/components/manage/Blocks/Section/SectionF/ViewDiff'

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
  section_a: typeof SectionAEdit
  section_b: typeof SectionBEdit
  section_c: typeof SectionCEdit
  section_d: typeof SectionDEdit
  section_e: typeof SectionEEdit
  section_f: typeof SectionFEdit
}

type ComponentsDiff = {
  adm_b?: DefaultComponentType
  adm_c?: DefaultComponentType
  adm_d?: DefaultComponentType
  report_info?: DefaultComponentType
  section_a: typeof SectionAViewDiff
  section_b: typeof SectionBViewDiff
  section_c: typeof SectionCViewDiff
  section_d: typeof SectionDViewDiff
  section_e: typeof SectionEViewDiff
  section_f: typeof SectionFViewDiff
}

const components: {
  create: ComponentsCreate
  diff: ComponentsDiff
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
  diff: {
    section_a: SectionAViewDiff,
    section_b: SectionBViewDiff,
    section_c: SectionCViewDiff,
    section_d: SectionDViewDiff,
    section_e: SectionEViewDiff,
    section_f: SectionFViewDiff,
  },
  edit: {
    adm_b: AdmBCreate,
    adm_c: AdmCCreate,
    adm_d: AdmDCreate,
    report_info: ReportInfoCreate,
    section_a: SectionAEdit,
    section_b: SectionBEdit,
    section_c: SectionCEdit,
    section_d: SectionDEdit,
    section_e: SectionEEdit,
    section_f: SectionFEdit,
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

export type EditSectionTypes = ComponentsEdit[keyof ComponentsEdit]
export type CreateSectionTypes = ComponentsCreate[keyof ComponentsCreate]
export type ViewSectionTypes = ComponentsView[keyof ComponentsView]

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
    ...((model === 'V' && mode !== 'diff' && ['report_info']) || []),
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
        component:
          (mode !== 'create' && components[mode].adm_b) || DefaultComponent,
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
        component:
          (mode !== 'create' && components[mode].adm_c) || DefaultComponent,
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
        component:
          (mode !== 'create' && components[mode].adm_d) || DefaultComponent,
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

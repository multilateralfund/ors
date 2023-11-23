import { filter, includes } from 'lodash'

import AdmBCreate from '@ors/components/manage/Blocks/Section/AdmB/Create/Create'
import AdmBView from '@ors/components/manage/Blocks/Section/AdmB/View/View'
import AdmCCreate from '@ors/components/manage/Blocks/Section/AdmC/Create/Create'
import AdmCView from '@ors/components/manage/Blocks/Section/AdmC/View/View'
import AdmDCreate from '@ors/components/manage/Blocks/Section/AdmD/Create/Create'
import AdmDView from '@ors/components/manage/Blocks/Section/AdmD/View/View'
import SectionACreate from '@ors/components/manage/Blocks/Section/SectionA/Create/Create'
import SectionAView from '@ors/components/manage/Blocks/Section/SectionA/View/View'
import SectionBCreate from '@ors/components/manage/Blocks/Section/SectionB/Create/Create'
import SectionB from '@ors/components/manage/Blocks/Section/SectionB/View/View'
import SectionCCreate from '@ors/components/manage/Blocks/Section/SectionC/Create/Create'
import SectionCView from '@ors/components/manage/Blocks/Section/SectionC/View/View'
import SectionDCreate from '@ors/components/manage/Blocks/Section/SectionD/Create/Create'
import SectionDView from '@ors/components/manage/Blocks/Section/SectionD/View/View'
import SectionECreate from '@ors/components/manage/Blocks/Section/SectionE/Create/Create'
import SectionEView from '@ors/components/manage/Blocks/Section/SectionE/View/View'
import SectionFCreate from '@ors/components/manage/Blocks/Section/SectionF/Create'
import SectionFView from '@ors/components/manage/Blocks/Section/SectionF/View'

export const variants = [
  {
    maxYear: 2004,
    minYear: -Infinity,
    model: 'I',
  },
  {
    maxYear: 2011,
    minYear: 2005,
    model: 'II',
  },
  {
    maxYear: 2018,
    minYear: 2012,
    model: 'III',
  },
  {
    maxYear: Infinity,
    minYear: 2019,
    model: 'IV',
  },
]

export function getViewSections(variant: any) {
  const { model } = variant
  const ids = [
    ...((includes(['I', 'II', 'III', 'IV'], model) && [
      'section_a',
      'section_c',
    ]) ||
      []),
    ...((includes(['IV'], model) && [
      'section_b',
      'section_d',
      'section_e',
      'section_f',
    ]) ||
      []),
    ...((includes(['I', 'II', 'III'], model) && ['adm_b']) || []),
    ...((includes(['II', 'III'], model) && ['adm_c', 'adm_d']) || []),
  ]

  return filter(
    [
      {
        id: 'section_a',
        allowFullScreen: true,
        component: SectionAView,
        label: 'Section A',
        panelId: 'section-A-panel',
        title: includes(['IV'], variant.model)
          ? 'SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)'
          : 'A. Data on Controlled Substances (in METRIC TONNES)',
      },
      {
        id: 'adm_b',
        allowFullScreen: true,
        component: AdmBView,
        label: 'Adm B',
        panelId: 'adm-B-panel',
        title: 'B. Regulatory, administrative and supportive actions',
      },
      {
        id: 'section_b',
        allowFullScreen: true,
        component: SectionB,
        label: 'Section B',
        panelId: 'section-B-panel',
        title:
          'SECTION B. ANNEX F - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)',
      },
      {
        id: 'adm_c',
        allowFullScreen: true,
        component: AdmCView,
        label: 'Adm C',
        panelId: 'adm-C-panel',
        title: 'C. Quantitative assessment of the phase-out programme',
      },
      {
        id: 'section_c',
        allowFullScreen: true,
        component: SectionCView,
        label: 'Section C',
        panelId: 'section-C-panel',
        title:
          'SECTION C. AVERAGE ESTIMATED PRICE OF HCFCs, HFCs AND ALTERNATIVES (US $/kg)',
      },
      {
        id: 'adm_d',
        component: AdmDView,
        label: 'Adm D',
        panelId: 'adm-D-panel',
        title: 'D. Qualitative assessment of the operation of HPMP',
      },
      {
        id: 'section_d',
        allowFullScreen: true,
        component: SectionDView,
        label: 'Section D',
        panelId: 'section-D-panel',
        title:
          'SECTION D. ANNEX F, GROUP II - DATA ON HFC-23 GENERATION (METRIC TONNES)',
      },
      {
        id: 'section_e',
        allowFullScreen: true,
        component: SectionEView,
        label: 'Section E',
        panelId: 'section-E-panel',
        title:
          'SECTION E. ANNEX F, GROUP II - DATA ON HFC-23 EMISSIONS (METRIC TONNES)',
      },
      {
        id: 'section_f',
        component: SectionFView,
        label: 'Section F',
        panelId: 'section-F-panel',
        title: 'SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES',
      },
    ],
    (section) => includes(ids, section.id),
  )
}

export function getEditSection(variant: any): Array<{
  allowFullScreen: boolean
  component: React.FC
  id:
    | 'adm_b'
    | 'adm_c'
    | 'adm_d'
    | 'section_a'
    | 'section_b'
    | 'section_c'
    | 'section_d'
    | 'section_e'
    | 'section_f'
  label: string
  panelId: string
  title: string
}> {
  const { model } = variant
  const ids = [
    ...((includes(['I', 'II', 'III', 'IV'], model) && [
      'section_a',
      'section_c',
    ]) ||
      []),
    ...((includes(['IV'], model) && [
      'section_b',
      'section_d',
      'section_e',
      'section_f',
    ]) ||
      []),
    ...((includes(['I', 'II', 'III'], model) && ['adm_b']) || []),
    ...((includes(['II', 'III'], model) && ['adm_c', 'adm_d']) || []),
  ]

  return filter(
    [
      {
        id: 'section_a',
        allowFullScreen: true,
        component: SectionACreate,
        label: 'Section A',
        panelId: 'section-A-panel',
        title:
          'SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)',
      },
      {
        id: 'adm_b',
        allowFullScreen: true,
        component: AdmBCreate,
        label: 'Adm B',
        panelId: 'adm-B-panel',
        title: 'B. Regulatory, administrative and supportive actions',
      },
      {
        id: 'section_b',
        allowFullScreen: true,
        component: SectionBCreate,
        label: 'Section B',
        panelId: 'section-B-panel',
        title:
          'SECTION B. ANNEX F - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)',
      },
      {
        id: 'adm_c',
        allowFullScreen: true,
        component: AdmCCreate,
        label: 'Adm C',
        panelId: 'adm-C-panel',
        title: 'C. Quantitative assessment of the phase-out programme',
      },
      {
        id: 'section_c',
        allowFullScreen: true,
        component: SectionCCreate,
        label: 'Section C',
        panelId: 'section-C-panel',
        title:
          'SECTION C. AVERAGE ESTIMATED PRICE OF HCFCs, HFCs AND ALTERNATIVES (US $/kg)',
      },
      {
        id: 'adm_d',
        allowFullScreen: true,
        component: AdmDCreate,
        label: 'Adm D',
        panelId: 'adm-D-panel',
        title: 'D. Qualitative assessment of the operation of HPMP',
      },
      {
        id: 'section_d',
        allowFullScreen: true,
        component: SectionDCreate,
        label: 'Section D',
        panelId: 'section-D-panel',
        title:
          'SECTION D. ANNEX F, GROUP II - DATA ON HFC-23 GENERATION (METRIC TONNES)',
      },
      {
        id: 'section_e',
        allowFullScreen: true,
        component: SectionECreate,
        label: 'Section E',
        panelId: 'section-E-panel',
        title:
          'SECTION E. ANNEX F, GROUP II - DATA ON HFC-23 EMISSIONS (METRIC TONNES)',
      },
      {
        id: 'section_f',
        allowFullScreen: false,
        component: SectionFCreate,
        label: 'Section F',
        panelId: 'section-F-panel',
        title: 'SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES',
      },
    ],
    (section) => includes(ids, section.id),
  )
}

export const createSections: Array<{
  allowFullScreen: boolean
  component: React.FC
  id:
    | 'section_a'
    | 'section_b'
    | 'section_c'
    | 'section_d'
    | 'section_e'
    | 'section_f'
  label: string
  panelId: string
  title: string
}> = [
  {
    id: 'section_a',
    allowFullScreen: true,
    component: SectionACreate,
    label: 'Section A',
    panelId: 'section-A-panel',
    title:
      'SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)',
  },
  {
    id: 'section_b',
    allowFullScreen: true,
    component: SectionBCreate,
    label: 'Section B',
    panelId: 'section-B-panel',
    title: 'SECTION B. ANNEX F - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)',
  },
  {
    id: 'section_c',
    allowFullScreen: true,
    component: SectionCCreate,
    label: 'Section C',
    panelId: 'section-C-panel',
    title:
      'SECTION C. AVERAGE ESTIMATED PRICE OF HCFCs, HFCs AND ALTERNATIVES (US $/kg)',
  },
  {
    id: 'section_d',
    allowFullScreen: true,
    component: SectionDCreate,
    label: 'Section D',
    panelId: 'section-D-panel',
    title:
      'SECTION D. ANNEX F, GROUP II - DATA ON HFC-23 GENERATION (METRIC TONNES)',
  },
  {
    id: 'section_e',
    allowFullScreen: true,
    component: SectionECreate,
    label: 'Section E',
    panelId: 'section-E-panel',
    title:
      'SECTION E. ANNEX F, GROUP II - DATA ON HFC-23 EMISSIONS (METRIC TONNES)',
  },
  {
    id: 'section_f',
    allowFullScreen: false,
    component: SectionFCreate,
    label: 'Section F',
    panelId: 'section-F-panel',
    title: 'SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES',
  },
]

import { includes } from 'lodash'

import AdmB from '@ors/components/manage/Blocks/Section/AdmB/View'
import AdmC from '@ors/components/manage/Blocks/Section/AdmC/View'
import AdmD from '@ors/components/manage/Blocks/Section/AdmD/View'
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
  const isAdmB = includes(['I', 'II', 'III'], model)
  const isAdmC = includes(['II', 'III'], model)
  const isAdmD = includes(['II', 'III'], model)
  const isSectionA = includes(['I', 'II', 'III', 'IV'], model)
  const isSectionB = includes(['IV'], model)
  const isSectionC = includes(['I', 'II', 'III', 'IV'], model)
  const isSectionD = includes(['IV'], model)
  const isSectionE = includes(['IV'], model)
  const isSectionF = includes(['IV'], model)

  return [
    ...(isSectionA
      ? [
          {
            id: 'section-A',
            allowFullScreen: true,
            component: SectionAView,
            label: 'Section A',
            panelId: 'section-A-panel',
          },
        ]
      : []),
    ...(isAdmB
      ? [
          {
            id: 'adm-B',
            allowFullScreen: true,
            component: AdmB,
            label: 'Adm B',
            panelId: 'adm-B-panel',
          },
        ]
      : []),
    ...(isSectionB
      ? [
          {
            id: 'section-B',
            allowFullScreen: true,
            component: SectionB,
            label: 'Section B',
            panelId: 'section-B-panel',
          },
        ]
      : []),
    ...(isAdmC
      ? [
          {
            id: 'adm-C',
            allowFullScreen: true,
            component: AdmC,
            label: 'Adm C',
            panelId: 'adm-C-panel',
          },
        ]
      : []),
    ...(isSectionC
      ? [
          {
            id: 'section-C',
            allowFullScreen: true,
            component: SectionCView,
            label: 'Section C',
            panelId: 'section-C-panel',
          },
        ]
      : []),
    ...(isAdmD
      ? [
          {
            id: 'adm-D',
            component: AdmD,
            label: 'Adm D',
            panelId: 'adm-D-panel',
          },
        ]
      : []),
    ...(isSectionD
      ? [
          {
            id: 'section-D',
            allowFullScreen: true,
            component: SectionDView,
            label: 'Section D',
            panelId: 'section-D-panel',
          },
        ]
      : []),
    ...(isSectionE
      ? [
          {
            id: 'section-E',
            allowFullScreen: true,
            component: SectionEView,
            label: 'Section E',
            panelId: 'section-E-panel',
          },
        ]
      : []),
    ...(isSectionF
      ? [
          {
            id: 'section-F',
            component: SectionFView,
            label: 'Section F',
            panelId: 'section-F-panel',
          },
        ]
      : []),
  ]
}

export function getCreateSections() {
  return [
    {
      id: 'section-A',
      allowFullScreen: true,
      component: SectionACreate,
      label: 'Section A',
      panelId: 'section-A-panel',
    },
    {
      id: 'section-B',
      allowFullScreen: true,
      component: SectionBCreate,
      label: 'Section B',
      panelId: 'section-B-panel',
    },
    {
      id: 'section-C',
      allowFullScreen: true,
      component: SectionCCreate,
      label: 'Section C',
      panelId: 'section-C-panel',
    },
    {
      id: 'section-D',
      allowFullScreen: true,
      component: SectionDCreate,
      label: 'Section D',
      panelId: 'section-D-panel',
    },
    {
      id: 'section-E',
      allowFullScreen: true,
      component: SectionECreate,
      label: 'Section E',
      panelId: 'section-E-panel',
    },
    {
      id: 'section-F',
      component: SectionFCreate,
      label: 'Section F',
      panelId: 'section-F-panel',
    },
  ]
}

import { includes } from 'lodash'

import AdmB from '@ors/components/manage/Blocks/Section/AdmB/View'
import AdmC from '@ors/components/manage/Blocks/Section/AdmC/View'
import AdmDE from '@ors/components/manage/Blocks/Section/AdmDE/View'
import SectionA from '@ors/components/manage/Blocks/Section/SectionA/View'
import SectionB from '@ors/components/manage/Blocks/Section/SectionB/View'
import SectionCView from '@ors/components/manage/Blocks/Section/SectionC/SectionCView'
import SectionDView from '@ors/components/manage/Blocks/Section/SectionD/SectionDView'
import SectionEView from '@ors/components/manage/Blocks/Section/SectionE/SectionEView'
import SectionFView from '@ors/components/manage/Blocks/Section/SectionF/SectionFView'

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

export function getSections(variant: any) {
  const { model } = variant
  const isAdmB = includes(['I', 'II', 'III'], model)
  const isAdmC = includes(['II', 'III'], model)
  const isAdmDE = includes(['II', 'III'], model)
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
            component: SectionA,
            label: 'Section A',
            panelId: 'section-A-panel',
          },
        ]
      : []),
    ...(isAdmB
      ? [
          {
            id: 'adm-B',
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
            component: SectionCView,
            label: 'Section C',
            panelId: 'section-C-panel',
          },
        ]
      : []),
    ...(isAdmDE
      ? [
          {
            id: 'adm-DE',
            component: AdmDE,
            label: 'Adm D-E',
            panelId: 'adm-DE-panel',
          },
        ]
      : []),
    ...(isSectionD
      ? [
          {
            id: 'section-D',
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

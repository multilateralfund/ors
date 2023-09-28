import SectionA from '@ors/components/manage/Blocks/Section/SectionA/Edit'
import SectionB from '@ors/components/manage/Blocks/Section/SectionB/Edit'

export const sections = [
  {
    id: 'section-A',
    component: SectionA,
    label: 'Section A',
    panelId: 'section-A-panel',
  },
  {
    id: 'section-B',
    component: SectionB,
    label: 'Section B',
    panelId: 'section-B-panel',
  },
  {
    id: 'section-C',
    component: () => null,
    label: 'Section C',
    panelId: 'section-C-panel',
  },
  {
    id: 'section-D',
    component: () => null,
    label: 'Section D',
    panelId: 'section-D-panel',
  },
  {
    id: 'section-E',
    component: () => null,
    label: 'Section E',
    panelId: 'section-E-panel',
  },
  {
    id: 'section-F',
    component: () => null,
    label: 'Section F',
    panelId: 'section-F-panel',
  },
]

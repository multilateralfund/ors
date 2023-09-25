'use client'
import React, { useState } from 'react'

import { Tab, Tabs } from '@mui/material'

import SectionAView from '@ors/components/manage/Blocks/Section/SectionA/SectionAView'
import SectionBView from '@ors/components/manage/Blocks/Section/SectionB/SectionBView'
import SectionCView from '@ors/components/manage/Blocks/Section/SectionC/SectionCView'
import SectionDView from '@ors/components/manage/Blocks/Section/SectionD/SectionDView'
import SectionEView from '@ors/components/manage/Blocks/Section/SectionE/SectionEView'
import SectionFView from '@ors/components/manage/Blocks/Section/SectionF/SectionFView'

interface SectionPanelProps {
  curentSection: number
  report?: Record<string, Array<any>> | null
  section: number
}

export const sections = [
  {
    id: 'section-A',
    component: SectionAView,
    label: 'Section A',
    panelId: 'section-A-panel',
  },
  {
    id: 'section-B',
    component: SectionBView,
    label: 'Section B',
    panelId: 'section-B-panel',
  },
  {
    id: 'section-C',
    component: SectionCView,
    label: 'Section C',
    panelId: 'section-C-panel',
  },
  {
    id: 'section-D',
    component: SectionDView,
    label: 'Section D',
    panelId: 'section-D-panel',
  },
  {
    id: 'section-E',
    component: SectionEView,
    label: 'Section E',
    panelId: 'section-E-panel',
  },
  {
    id: 'section-F',
    component: SectionFView,
    label: 'Section F',
    panelId: 'section-F-panel',
  },
]

function SectionPanel(props: SectionPanelProps) {
  const { curentSection, report, section, ...rest } = props
  const Section: React.FC<any> = sections[section].component

  return (
    <div
      id={sections[section].panelId}
      aria-labelledby={sections[section].id}
      hidden={curentSection !== section}
      role="tabpanel"
      {...rest}
    >
      <Section report={report} />
    </div>
  )
}

export default function CPReportView({
  report,
}: {
  report?: Record<string, Array<any>> | null
}) {
  const [activeSection, setActiveSection] = useState(0)

  return (
    <>
      <Tabs
        className="mb-4"
        aria-label="create submission sections"
        value={activeSection}
        onChange={(event: React.SyntheticEvent, newSection: number) => {
          setActiveSection(newSection)
        }}
      >
        {sections.map((section) => (
          <Tab
            key={section.id}
            aria-controls={section.panelId}
            label={section.label}
          />
        ))}
      </Tabs>
      {sections.map((section, index) => (
        <SectionPanel
          key={section.id}
          curentSection={activeSection}
          report={report}
          section={index}
        />
      ))}
    </>
  )
}

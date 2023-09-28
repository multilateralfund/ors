'use client'
import React, { useMemo, useState } from 'react'

import { Tab, Tabs } from '@mui/material'
import { filter, isString } from 'lodash'
import { useSearchParams } from 'next/navigation'

import { getSections, variants } from '.'

interface SectionPanelProps {
  admForm: Record<string, any>
  report: Record<string, Array<any>>
  section: Record<string, any>
  variant: Record<string, any>
}

function SectionPanel(props: SectionPanelProps) {
  const { admForm, report, section, variant, ...rest } = props
  const Section: React.FC<any> = section.component

  return (
    <div
      id={section.panelId}
      aria-labelledby={section.id}
      role="tabpanel"
      {...rest}
    >
      <Section admForm={admForm} report={report} variant={variant} />
    </div>
  )
}

export default function CPReportView(props: {
  admForm?: Record<string, any> | null
  report?: Record<string, Array<any>> | null
}) {
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState(0)
  const report: any = useMemo(
    () => ({
      ...(props.report || {}),
      name: searchParams.get('name'),
      year: searchParams.get('year'),
    }),
    [props.report, searchParams],
  )
  const variant = useMemo(
    () =>
      filter(variants, (variant) => {
        const year =
          report && isString(report?.year)
            ? parseInt(report.year)
            : new Date().getFullYear()
        return variant.minYear <= year && variant.maxYear >= year
      })[0],
    [report],
  )

  const sections = useMemo(() => getSections(variant), [variant])

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
            disableRipple
          />
        ))}
      </Tabs>
      <SectionPanel
        admForm={props.admForm || {}}
        report={report}
        section={sections[activeSection]}
        variant={variant}
      />
    </>
  )
}

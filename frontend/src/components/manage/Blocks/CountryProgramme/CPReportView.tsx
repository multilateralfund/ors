'use client'
import React, { useEffect, useMemo, useState } from 'react'

import { Button, Tab, Tabs } from '@mui/material'
import { filter } from 'lodash'

import { getSections, variants } from '.'

interface SectionPanelProps {
  emptyForm: Record<string, any>
  exitFullScreen: () => void
  fullScreen: boolean
  report: Record<string, any>
  section: Record<string, any>
  variant: Record<string, any>
}

function SectionPanel(props: SectionPanelProps) {
  const {
    emptyForm,
    exitFullScreen,
    fullScreen,
    report,
    section,
    variant,
    ...rest
  } = props
  const Section: React.FC<any> = section.component
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      id={section.panelId}
      aria-labelledby={section.id}
      role="tabpanel"
      {...rest}
    >
      {mounted && (
        <Section
          emptyForm={emptyForm}
          exitFullScreen={exitFullScreen}
          fullScreen={fullScreen}
          report={report}
          variant={variant}
        />
      )}
    </div>
  )
}

export default function CPReportView(props: {
  emptyForm?: Record<string, any> | null
  report?: Record<string, any>
}) {
  const [activeSection, setActiveSection] = useState(0)
  const [fullScreen, setFullScreen] = useState(false)
  const [report]: any = useState({
    ...(props.report || {}),
    name: props.report?.cp_report?.name,
    year: props.report?.cp_report?.year,
  })
  const [variant] = useState(
    filter(variants, (variant) => {
      const year = report.year
      return variant.minYear <= year && variant.maxYear >= year
    })[0],
  )
  const [sections] = useState(getSections(variant))

  const section = useMemo(
    () => sections[activeSection],
    [activeSection, sections],
  )

  return (
    <>
      <Tabs
        className="country-programme-tabs mb-4"
        aria-label="create submission sections"
        value={activeSection}
        onChange={(event: React.SyntheticEvent, newSection: number) => {
          setActiveSection(newSection)
          setFullScreen(false)
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
      {section.allowFullScreen && (
        <div className="mb-4 text-right">
          <Button variant="outlined" onClick={() => setFullScreen(true)}>
            Full screen
          </Button>
        </div>
      )}
      <div id={section.panelId} aria-labelledby={section.id} role="tabpanel">
        <SectionPanel
          emptyForm={props.emptyForm || {}}
          fullScreen={fullScreen}
          report={report}
          section={section}
          variant={variant}
          exitFullScreen={() => {
            setFullScreen(false)
          }}
        />
      </div>
    </>
  )
}

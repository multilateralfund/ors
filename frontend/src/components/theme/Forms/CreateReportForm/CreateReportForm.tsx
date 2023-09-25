'use client'
import React, { useState } from 'react'

import { Box, Button, Tab, Tabs } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import Portal from '@ors/components/manage/Utils/Portal'

import { sections } from './schema'

interface SectionPanelProps {
  curentSection: number
  section: number
}

function SectionPanel(props: SectionPanelProps) {
  const { curentSection, section, ...rest } = props
  const Section = sections[section].component

  return (
    <div
      id={sections[section].panelId}
      aria-labelledby={sections[section].id}
      hidden={curentSection !== section}
      role="tabpanel"
      {...rest}
    >
      <Section />
    </div>
  )
}

export default function CreateReportForm() {
  const [activeSection, setActiveSection] = useState(0)

  return (
    <form className="create-submission-form">
      <div className="grid grid-cols-3 gap-x-4">
        <Field id="name" name="name" label="Report name" />
        <Field id="year" name="year" label="Year" />
        <Field id="country" name="country_id" label="Country" />
      </div>
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
      {sections.map((section, index) => (
        <SectionPanel
          key={section.id}
          curentSection={activeSection}
          section={index}
        />
      ))}
      <Portal domNode="bottom-control">
        <Box className="flex w-full justify-between rounded-none border-0 border-t px-4">
          <Button color="secondary" size="small" variant="contained">
            Close
          </Button>
          <Button color="primary" size="small" variant="contained">
            Submit
          </Button>
        </Box>
      </Portal>
    </form>
  )
}

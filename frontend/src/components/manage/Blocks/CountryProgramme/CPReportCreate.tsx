'use client'
import React, { useEffect, useMemo, useState } from 'react'

import { Box, Button, Tab, Tabs, Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import Portal from '@ors/components/manage/Utils/Portal'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

import { getCreateSections } from '.'

interface SectionPanelProps {
  emptyForm: Record<string, any>
  exitFullScreen: () => void
  fullScreen: boolean
  section: Record<string, any>
}

function SectionPanel(props: SectionPanelProps) {
  const { emptyForm, exitFullScreen, fullScreen, section, ...rest } = props
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
        />
      )}
    </div>
  )
}

export default function CpReportCreate(props: {
  emptyForm?: Record<string, any> | null
}) {
  const [activeSection, setActiveSection] = useState(3)
  const [fullScreen, setFullScreen] = useState(false)

  const [sections] = useState(getCreateSections())

  const section = useMemo(
    () => sections[activeSection],
    [activeSection, sections],
  )

  return (
    <>
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h5">
          New submission
        </Typography>
      </HeaderTitle>
      <form className="create-submission-form">
        <div className="grid grid-cols-3 gap-x-4">
          <Field id="name" name="name" label="Report name" />
          <Field id="country" name="country_id" label="Country" />
        </div>
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
            section={section}
            exitFullScreen={() => {
              setFullScreen(false)
            }}
          />
        </div>
        <Portal domNode="bottom-control">
          <Box className="rounded-none border-0 border-t px-4">
            <div className="container flex w-full justify-between">
              <Button color="secondary" size="small" variant="contained">
                Close
              </Button>
              <Button color="primary" size="small" variant="contained">
                Submit
              </Button>
            </div>
          </Box>
        </Portal>
      </form>
    </>
  )
}

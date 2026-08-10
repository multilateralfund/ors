import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRFilesViewer from './PCRFilesViewer'
import PCRFilesInput from './PCRFilesInput'

import { Tab, Tabs } from '@mui/material'
import { find, map } from 'lodash'

const PCRDocumentation = () => {
  const sectionIdentifier = 'supporting_evidences'

  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData } = useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []

  const crtAgencies = map(
    sectionData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency_id)?.name,
  )

  return (
    <>
      <Tabs
        aria-label="supporting-evidences-tabs"
        className="sectionsTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        value={crtTab}
        onChange={(_, newValue) => {
          setCrtTab(newValue)
        }}
      >
        {crtAgencies.map((agency) => (
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        <div className="flex w-full flex-col gap-4">
          <PCRFilesViewer {...{ crtTab }} />
          <PCRFilesInput {...{ crtTab }} />
        </div>
      </div>
    </>
  )
}

export default PCRDocumentation

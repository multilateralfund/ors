import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'

import { Tabs, Tab } from '@mui/material'
import { find, map } from 'lodash'

const PCRGenderMainstreaming = () => {
  const sectionIdentifier = 'gender_mainstreaming'

  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData } = useContext(PCRDataContext)
  const genderMainstreamingData = PCRData[sectionIdentifier] || []

  const [crtAgency, setCrtAgency] = useState(0)

  const crtAgencies = map(
    genderMainstreamingData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency_id)?.name,
  )

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <>
          <div>
            <Tabs
              aria-label="gender-mainstreaming-tabs"
              className="sectionsTabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              TabIndicatorProps={{
                className: 'h-0',
                style: { transitionDuration: '150ms' },
              }}
              value={crtAgency}
              onChange={(_, newValue) => {
                setCrtAgency(newValue)
              }}
            >
              {crtAgencies.map((agency) => (
                <Tab
                  key={agency}
                  aria-controls={agency}
                  id={agency}
                  label={agency}
                />
              ))}
            </Tabs>
            <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
              {crtAgencies
                .filter((_, index) => index === crtAgency)
                .map((_, index) => (
                  <div key={index}>Gender mainstreaming</div>
                ))}
            </div>
          </div>
        </>
      </div>
    </>
  )
}

export default PCRGenderMainstreaming

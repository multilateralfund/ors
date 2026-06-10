import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { PCRSectionsProps } from '../interfaces'

import { Divider, Tab } from '@mui/material'
import PCRSummaryAndDelaysPrefilledData from './PCRSummaryAndDelaysPrefilledData'
import PCRSummaryAndDelaysUserInputData from './PCRSummaryAndDelaysUserInputData'
import { useContext, useState } from 'react'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { find, map } from 'lodash'
import { Tabs } from '@mui/material'

const PCRSummaryAndDelaysSection = ({
  PCRData,
  setPCRData,
  setCurrentTab,
  errors,
}: PCRSectionsProps) => {
  const sectionIdentifier = 'summary_and_delays'
  const summaryAndDelaysData = PCRData[sectionIdentifier] || []

  const { agencies } = useContext(ProjectsDataContext)

  const [crtAgency, setCrtAgency] = useState(0)

  const crtAgencies = map(
    summaryAndDelaysData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency)?.name,
  )

  return (
    <>
      <div>
        <Tabs
          aria-label="summary-and-delays-tabs"
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
            .map((crtAgencyEntry) => {
              const crtAgencyData = summaryAndDelaysData[crtAgency] || []

              return (
                <span key={crtAgency}>
                  <PCRSummaryAndDelaysPrefilledData
                    {...{
                      PCRData,
                      setPCRData,
                      errors,
                      crtAgencyEntry,
                      crtAgencyData,
                    }}
                  />
                  <Divider className="my-6" />
                  <PCRSummaryAndDelaysUserInputData
                    {...{
                      PCRData,
                      setPCRData,
                      errors,
                      crtAgencyData,
                      crtAgency,
                    }}
                  />
                </span>
              )
            })}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton setCurrentTab={setCurrentTab} />
      </div>
    </>
  )
}

export default PCRSummaryAndDelaysSection

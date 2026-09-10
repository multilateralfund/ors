import { useState } from 'react'

import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRGenderMainstreaming from './PCRViewTabs/PCRGenderMainstreaming'
import PCRResultsAssessment from './PCRViewTabs/PCRResultsAssessment'
import PCRSummaryOfKeyData from './PCRViewTabs/PCRSummaryOfKeyData'
import PCRLessonsLearned from './PCRViewTabs/PCRLessonsLearned'
import PCRCausesOfDelay from './PCRViewTabs/PCRCausesOfDelay'
import PCRDocumentation from './PCRViewTabs/PCRDocumentation'
import PCROverview from './PCRViewTabs/PCROverview'
import PCRSdgs from './PCRViewTabs/PCRSdgs'
import { PCRResponse } from '../interfaces'

import { Tabs, Tab } from '@mui/material'

const PCRView = ({ pcr }: { pcr: PCRResponse }) => {
  const [currentTab, setCurrentTab] = useState<number>(0)

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      component: <PCROverview {...{ pcr }} />,
    },
    {
      id: 'summary_of_key_data',
      label: 'Summary of key data (tranches)',
      component: <PCRSummaryOfKeyData />,
    },
    {
      id: 'results_assessment',
      label: 'Project results overall assessment',
      component: <PCRResultsAssessment {...{ pcr }} />,
    },
    {
      id: 'causes_of_delay',
      label: 'Causes of delay',
      component: <PCRCausesOfDelay {...{ pcr }} />,
    },
    {
      id: 'lessons_learned',
      label: 'Lessons learned',
      component: <PCRLessonsLearned {...{ pcr }} />,
    },
    {
      id: 'gender_mainstreaming',
      label: 'Gender mainstreaming',
      component: <PCRGenderMainstreaming />,
    },
    {
      id: 'sdgs_contribution',
      label: 'SDGs (optional)',
      component: <PCRSdgs />,
    },
    {
      id: 'supporting_evidences',
      label: 'Other supporting evidence',
      component: <PCRDocumentation />,
    },
  ]

  return (
    <>
      <Tabs
        aria-label="pcr-view"
        className="sectionsTabs pcrTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        value={currentTab}
        onChange={(_, newValue) => {
          setCurrentTab(newValue)
        }}
      >
        {tabs.map(({ id, label }) => (
          <Tab key={id} aria-controls={id} {...{ id, label }} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {tabs
          .filter((_, index) => index === currentTab)
          .map(({ id, component }) => (
            <span key={id}>
              {component}
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                {currentTab !== 0 && (
                  <NavigationButton
                    type="previous"
                    setCurrentTab={setCurrentTab}
                  />
                )}
                {currentTab !== tabs.length - 1 && (
                  <NavigationButton setCurrentTab={setCurrentTab} />
                )}
              </div>
            </span>
          ))}
      </div>
    </>
  )
}

export default PCRView

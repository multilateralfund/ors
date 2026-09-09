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

  const TabLabel = ({ title }: { title: string }) => (
    <div className="relative flex items-center justify-between gap-x-2">
      <div className="leading-tight">{title}</div>
    </div>
  )

  const tabs = [
    {
      id: 'overview',
      label: <TabLabel title="Overview" />,
      component: <PCROverview {...{ pcr }} />,
    },
    {
      id: 'summary_of_key_data',
      label: <TabLabel title="Summary of key data (tranches)" />,
      component: <PCRSummaryOfKeyData />,
    },
    {
      id: 'results_assessment',
      label: <TabLabel title="Project results overall assessment" />,
      component: <PCRResultsAssessment />,
    },
    {
      id: 'causes_of_delay',
      label: <TabLabel title="Causes of delay" />,
      component: <PCRCausesOfDelay />,
    },
    {
      id: 'lessons_learned',
      label: <TabLabel title="Lessons learned" />,
      component: <PCRLessonsLearned />,
    },
    {
      id: 'gender_mainstreaming',
      label: <TabLabel title="Gender mainstreaming" />,
      component: <PCRGenderMainstreaming />,
    },
    {
      id: 'sdgs_contribution',
      label: <TabLabel title="SDGs (optional)" />,
      component: <PCRSdgs />,
    },
    {
      id: 'supporting_evidences',
      label: <TabLabel title="Other supporting evidence" />,
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

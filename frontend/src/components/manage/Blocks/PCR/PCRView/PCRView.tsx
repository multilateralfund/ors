import { useContext, useState } from 'react'

import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRGenderMainstreaming from './PCRViewTabs/PCRGenderMainstreaming'
import PCRResultsAssessment from './PCRViewTabs/PCRResultsAssessment'
import PCRSummaryOfKeyData from './PCRViewTabs/PCRSummaryOfKeyData'
import PCRLessonsLearned from './PCRViewTabs/PCRLessonsLearned'
import PCRCausesOfDelay from './PCRViewTabs/PCRCausesOfDelay'
import PCRDocumentation from './PCRViewTabs/PCRDocumentation'
import PCROverview from './PCRViewTabs/PCROverview'
import PCRHistory from './PCRViewTabs/PCRHistory'
import PCRSdgs from './PCRViewTabs/PCRSdgs'

import { Tabs, Tab } from '@mui/material'

const PCRView = () => {
  const { pcr } = useContext(PCRDataContext)

  const [currentTab, setCurrentTab] = useState<number>(0)

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      component: <PCROverview />,
    },
    {
      id: 'summary_of_key_data',
      label: 'Summary of key data',
      component: <PCRSummaryOfKeyData />,
    },
    {
      id: 'results_assessment',
      label: 'Project results',
      component: <PCRResultsAssessment />,
    },
    {
      id: 'causes_of_delay',
      label: 'Causes of delay',
      component: <PCRCausesOfDelay />,
    },
    {
      id: 'lessons_learned',
      label: 'Lessons learned',
      component: <PCRLessonsLearned />,
    },
    {
      id: 'gender_mainstreaming',
      label: 'Gender mainstreaming',
      component: <PCRGenderMainstreaming />,
    },
    {
      id: 'sdgs_contribution',
      label: 'SDGs',
      component: <PCRSdgs />,
    },
    {
      id: 'supporting_evidences',
      label: 'Other supporting evidence',
      component: <PCRDocumentation />,
    },
    ...(!pcr.data?.latest_pcr_id
      ? [
          {
            id: 'history',
            label: 'History',
            component: <PCRHistory />,
          },
        ]
      : []),
  ]

  const prevTab = tabs[currentTab - 1]
  const nextTab = tabs[currentTab + 1]

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
      <div className="rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {tabs[currentTab].component}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
          {prevTab && (
            <NavigationButton
              type="previous"
              className="!h-10"
              extraText={prevTab.label}
              setCurrentTab={setCurrentTab}
            />
          )}
          {nextTab && (
            <NavigationButton
              className="!h-10 !border-primary !bg-primary !text-mlfs-hlYellow"
              extraText={nextTab.label}
              setCurrentTab={setCurrentTab}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default PCRView

import { useState } from 'react'

import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRArchiveResultsAssessment from './PCRArchiveTabs/PCRArchiveResultsAssessment'
import PCRArchiveLessonsLearned from './PCRArchiveTabs/PCRArchiveLessonsLearned'
import PCRArchiveCausesOfDelay from './PCRArchiveTabs/PCRArchiveCausesOfDelay'
import PCRArchiveDocumentation from './PCRArchiveTabs/PCRArchiveDocumentation'
import { ArchivePCRResponse } from '../interfaces'

import { Tabs, Tab } from '@mui/material'

const PCRArchive = ({ pcr }: { pcr: ArchivePCRResponse }) => {
  const [currentTab, setCurrentTab] = useState<number>(0)

  const tabs = [
    {
      id: 'results_assessment',
      label: 'Project results',
      component: <PCRArchiveResultsAssessment pcr={pcr} />,
    },
    {
      id: 'causes_of_delay',
      label: 'Causes of delay',
      component: <PCRArchiveCausesOfDelay pcr={pcr} />,
    },
    {
      id: 'lessons_learned',
      label: 'Lessons learned',
      component: <PCRArchiveLessonsLearned pcr={pcr} />,
    },
    {
      id: 'supporting_evidences',
      label: 'Other supporting evidence',
      component: <PCRArchiveDocumentation pcr={pcr} />,
    },
  ]

  const prevTab = tabs[currentTab - 1]
  const nextTab = tabs[currentTab + 1]

  return (
    <>
      <Tabs
        aria-label="pcr-archive"
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

export default PCRArchive

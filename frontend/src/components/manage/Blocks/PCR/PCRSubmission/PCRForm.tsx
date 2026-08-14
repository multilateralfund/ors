import { useContext, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator'
import {
  ErrorsList,
  NavigationButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRGenderMainstreaming from './PCRGenderMainstreaming'
import PCRResultsAssessment from './PCRResultsAssessment'
import PCRSummaryOfKeyData from './PCRSummaryOfKeyData'
import PCRLessonsLearned from './PCRLessonsLearned'
import PCRCausesOfDelay from './PCRCausesOfDelay'
import PCRDocumentation from './PCRDocumentation'
import PCROverview from './PCROverview'
import PCRSdgs from './PCRSdgs'
import { formatErrors, hasSectionErrors } from '../utils'

import { Tabs, Tab } from '@mui/material'

const PCRForm = () => {
  const [currentTab, setCurrentTab] = useState<number>(0)

  const { errors } = useContext(PCRDataContext)

  const tabMapping = {
    overview: { title: 'Overview', errors: errors.overview },
    summary_of_key_data: {
      title: 'Summary of key data (tranches)',
      errors: {},
    },
    results_assessment: {
      title: 'Project results overall assessment',
      errors: errors.results_assessment,
    },
    causes_of_delay: {
      title: 'Causes of delay',
      errors: errors.causes_of_delay,
    },
    lessons_learned: {
      title: 'Lessons learned',
      errors: errors.lessons_learned,
    },
    gender_mainstreaming: { title: 'Gender mainstreaming', errors: {} },
    sdgs_contribution: { title: 'SDGs (optional)', errors: {} },
    supporting_evidences: { title: 'Other supporting evidence', errors: {} },
  }

  const TabLabel = ({ field }: { field: keyof typeof tabMapping }) => (
    <div className="relative flex items-center justify-between gap-x-2">
      <div className="leading-tight">{tabMapping[field].title}</div>
      {hasSectionErrors(tabMapping[field].errors) && (
        <SectionErrorIndicator errors={[]} />
      )}
    </div>
  )

  const tabs = [
    {
      id: 'overview',
      label: <TabLabel field="overview" />,
      component: <PCROverview />,
      shouldDisplayErrors: true,
    },
    {
      id: 'summary_of_key_data',
      label: <TabLabel field="summary_of_key_data" />,
      component: <PCRSummaryOfKeyData />,
    },
    {
      id: 'results_assessment',
      label: <TabLabel field="results_assessment" />,
      component: <PCRResultsAssessment />,
    },
    {
      id: 'causes_of_delay',
      label: <TabLabel field="causes_of_delay" />,
      component: <PCRCausesOfDelay />,
    },
    {
      id: 'lessons_learned',
      label: <TabLabel field="lessons_learned" />,
      component: <PCRLessonsLearned />,
    },
    {
      id: 'gender_mainstreaming',
      label: <TabLabel field="gender_mainstreaming" />,
      component: <PCRGenderMainstreaming />,
    },
    {
      id: 'sdgs_contribution',
      label: <TabLabel field="sdgs_contribution" />,
      component: <PCRSdgs />,
    },
    {
      id: 'supporting_evidences',
      label: <TabLabel field="supporting_evidences" />,
      component: <PCRDocumentation />,
    },
  ]

  return (
    <>
      <Tabs
        aria-label="pcr-form"
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
          .map(({ id, component, shouldDisplayErrors }) => {
            const tabErrors = formatErrors(
              tabMapping[id as keyof typeof tabMapping].errors,
            )

            return (
              <span key={id}>
                {shouldDisplayErrors && tabErrors && tabErrors.length > 0 && (
                  <ErrorsList errors={tabErrors} />
                )}
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
            )
          })}
      </div>
    </>
  )
}

export default PCRForm

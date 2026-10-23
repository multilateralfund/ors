import { useContext, useEffect, useState } from 'react'

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
import {
  SectionTitle,
  UserInfo,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import {
  formatErrors,
  formatNestedPcErrors,
  hasSectionErrors,
  normalizeErrors,
} from '../utils'
import {
  pcField,
  cdField,
  llField,
  ppField,
  supportingEvidencesField,
  requiredMessage,
} from '../constants'

import { flatMap, map, omit } from 'lodash'
import { Tabs, Tab } from '@mui/material'

const PCRForm = () => {
  const [currentTab, setCurrentTab] = useState<number>(0)

  const { PCRData, errors, setErrors } = useContext(PCRDataContext)

  const tabMapping = {
    overview: { title: 'Overview', errors: errors.overview },
    summary_of_key_data: {
      title: 'Summary of key data',
      errors: errors.summary_of_key_data,
    },
    results_assessment: {
      title: 'Project results',
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
    gender_mainstreaming: {
      title: 'Gender mainstreaming',
      errors: errors.gender_mainstreaming,
    },
    sdgs_contribution: { title: 'SDGs', errors: errors.sdgs_contribution },
    supporting_evidences: {
      title: 'Other supporting evidence',
      errors: errors.supporting_evidences,
    },
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
      title: 'Summary of key data',
      component: <PCRSummaryOfKeyData />,
    },
    {
      id: 'results_assessment',
      label: <TabLabel field="results_assessment" />,
      title: 'Project results: overall assessment highlights',
      component: <PCRResultsAssessment />,
    },
    {
      id: 'causes_of_delay',
      label: <TabLabel field="causes_of_delay" />,
      title: 'Causes of delay',
      component: <PCRCausesOfDelay />,
    },
    {
      id: 'lessons_learned',
      label: <TabLabel field="lessons_learned" />,
      title: 'Lessons learned',
      component: <PCRLessonsLearned />,
    },
    {
      id: 'gender_mainstreaming',
      label: <TabLabel field="gender_mainstreaming" />,
      title: 'Gender mainstreaming',
      component: <PCRGenderMainstreaming />,
    },
    {
      id: 'sdgs_contribution',
      label: <TabLabel field="sdgs_contribution" />,
      title: 'Contribution to the Sustainable Development Goals (SDGs)',
      component: <PCRSdgs />,
    },
    {
      id: 'supporting_evidences',
      label: <TabLabel field="supporting_evidences" />,
      title: 'Other supporting evidence',
      component: <PCRDocumentation />,
    },
  ]
  const additionalCommentsField = 'additional_comments'

  const overviewData = PCRData.overview || []
  const additionalCommentsData = overviewData[additionalCommentsField] || []

  useEffect(() => {
    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      [additionalCommentsField]: map(
        additionalCommentsData,
        (comment, index) => {
          const existingErrors = prev[additionalCommentsField]?.[index] ?? {}
          let updatedErrors = { ...existingErrors }

          if (!comment.entity) {
            updatedErrors = { ...updatedErrors, entity: [requiredMessage] }
          } else if (existingErrors.entity?.includes(requiredMessage)) {
            updatedErrors = omit(updatedErrors, ['entity'])
          }

          return normalizeErrors(updatedErrors)
        },
      ),
    }))
  }, [JSON.stringify(additionalCommentsData)])

  const causesOfDelayData = PCRData.causes_of_delay || []
  const cdProjectComponents = flatMap(
    causesOfDelayData,
    ({ project_components }) => project_components,
  )
  const lessonsLearnedData = PCRData.lessons_learned || []
  const llProjectComponents = flatMap(
    lessonsLearnedData,
    ({ project_components }) => project_components,
  )

  useEffect(() => {
    const projectComponents = [...cdProjectComponents, ...llProjectComponents]
    const pcIdField = 'project_component_option_id'

    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      [pcField]: map(projectComponents, (pc, index) => {
        const existingErrors = prev[pcField]?.[index] ?? {}
        let updatedErrors = { ...existingErrors }

        if (!pc[pcIdField]) {
          updatedErrors[pcIdField] = [requiredMessage]
        } else if (updatedErrors[pcIdField]?.includes(requiredMessage)) {
          updatedErrors = omit(updatedErrors, [pcIdField])
        }

        formatNestedPcErrors(
          pc,
          updatedErrors,
          existingErrors,
          cdField,
          'delay_id',
        )
        formatNestedPcErrors(
          pc,
          updatedErrors,
          existingErrors,
          llField,
          'lesson_id',
        )

        return normalizeErrors(updatedErrors)
      }),
    }))
  }, [JSON.stringify(causesOfDelayData), JSON.stringify(lessonsLearnedData)])

  const genderMainstreamingData = PCRData.gender_mainstreaming || []

  useEffect(() => {
    const ppData = flatMap(
      genderMainstreamingData,
      ({ gender_mainstreamings }) => gender_mainstreamings,
    )

    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      [ppField]: map(ppData, (pp, index) => {
        const ppIdField = 'project_preparation'

        const existingErrors = prev[ppField]?.[index] ?? {}
        let updatedErrors = { ...existingErrors }

        if (!pp[ppIdField]) {
          updatedErrors[ppIdField] = [requiredMessage]
        } else if (updatedErrors[ppIdField]?.includes(requiredMessage)) {
          updatedErrors = omit(updatedErrors, [ppIdField])
        }

        return normalizeErrors(updatedErrors)
      }),
    }))
  }, [JSON.stringify(genderMainstreamingData)])

  const supportingEvidencesData = PCRData[supportingEvidencesField] || []

  useEffect(() => {
    const evidencesData = flatMap(
      supportingEvidencesData,
      ({ evidences }) => evidences,
    )

    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      [supportingEvidencesField]: map(evidencesData, (evidence, index) => {
        const evidenceIdField = 'section_id'

        const existingErrors = prev[supportingEvidencesField]?.[index] ?? {}
        let updatedErrors = { ...existingErrors }

        if (!evidence[evidenceIdField]) {
          updatedErrors[evidenceIdField] = [requiredMessage]
        } else if (updatedErrors[evidenceIdField]?.includes(requiredMessage)) {
          updatedErrors = omit(updatedErrors, [evidenceIdField])
        }

        return normalizeErrors(updatedErrors)
      }),
    }))
  }, [JSON.stringify(supportingEvidencesData)])

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
          .map(({ id, title, component, shouldDisplayErrors }) => {
            const tabErrors = formatErrors(
              tabMapping[id as keyof typeof tabMapping].errors,
            )

            return (
              <span key={id}>
                {title && (
                  <div className="mb-6">
                    {id === 'gender_mainstreaming' ? (
                      <div className="flex items-center gap-3">
                        <SectionTitle>{title}</SectionTitle>
                        <UserInfo info="Referring to the required indicators in annex II of the Operational policy on gender mainstreaming for the Multilateral Fund and to streamline reporting requirements, please describe how the different phases of the project cycle met the gender mainstreaming indicators." />
                      </div>
                    ) : (
                      <SectionTitle>{title}</SectionTitle>
                    )}
                  </div>
                )}
                {shouldDisplayErrors && tabErrors && tabErrors.length > 0 && (
                  <ErrorsList errors={tabErrors} />
                )}
                {component}
                <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
                  {currentTab !== 0 && (
                    <NavigationButton
                      type="previous"
                      setCurrentTab={setCurrentTab}
                      className="!h-10"
                    />
                  )}
                  {currentTab !== tabs.length - 1 && (
                    <NavigationButton
                      setCurrentTab={setCurrentTab}
                      className="!h-10 !border-primary !bg-primary !text-mlfs-hlYellow"
                    />
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

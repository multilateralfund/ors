import { useContext, useEffect, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator'
import {
  ErrorsList,
  NavigationButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRSummaryOfKeyData, { createSummaryData } from './PCRSummaryOfKeyData'
import PCRGenderMainstreaming from './PCRGenderMainstreaming'
import PCRHistory from '../PCRView/PCRViewTabs/PCRHistory'
import PCRResultsAssessment from './PCRResultsAssessment'
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
  hasSectionErrors,
  normalizeErrors,
  getOtherOptionId,
  getSummaryOfKeyDataErrors,
  isProjectNotApproved,
  setRequiredError,
} from '../utils'
import {
  summaryOfKeyDataField,
  ppField,
  delayField,
  dcField,
  llField,
  prField,
  sdgsField,
  sdgsContributionField,
  supportingEvidencesField,
  overviewRequiredFields,
  initialActivitiesData,
  requiredMessage,
  submitRequiredMessage,
} from '../constants'

import { Tabs, Tab } from '@mui/material'
import {
  filter,
  flatMap,
  forEach,
  isEmpty,
  isPlainObject,
  keys,
  map,
  omit,
  pick,
  reduce,
} from 'lodash'

const PCRForm = ({ mode }: { mode: string }) => {
  const [currentTab, setCurrentTab] = useState<number>(0)

  const {
    pcrMetaproject,
    PCRData,
    setPCRData,
    errors,
    setErrors,
    ratingOptions,
  } = useContext(PCRDataContext)

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
    delay_causes: {
      title: 'Causes of delay',
      errors: errors.delay_causes,
    },
    learned_lessons: {
      title: 'Lessons learned',
      errors: errors.learned_lessons,
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
    history: { title: 'History', errors: {} },
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
      id: 'delay_causes',
      label: <TabLabel field="delay_causes" />,
      title: 'Causes of delay',
      component: <PCRCausesOfDelay />,
    },
    {
      id: 'learned_lessons',
      label: <TabLabel field="learned_lessons" />,
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
    ...(mode === 'edit'
      ? [
          {
            id: 'history',
            label: <TabLabel field="history" />,
            component: <PCRHistory />,
          },
        ]
      : []),
  ]

  const overviewData = PCRData.overview || []
  const overviewRequiredData = pick(overviewData, overviewRequiredFields)
  const isOtherRating = overviewData.rating === getOtherOptionId(ratingOptions)

  useEffect(() => {
    setErrors((prev: Record<string, any[]>) => {
      let updatedErrors = { ...prev }

      forEach(overviewRequiredFields, (field) => {
        const isRequired = field !== 'rating_explanation_other' || isOtherRating
        const isEmpty = !String(overviewRequiredData[field] ?? '').trim()

        if (isRequired && isEmpty) {
          updatedErrors[field] = [submitRequiredMessage]
        } else if (updatedErrors[field]?.includes(submitRequiredMessage)) {
          updatedErrors = omit(updatedErrors, [field])
        }
      })

      return updatedErrors
    })
  }, [JSON.stringify(overviewRequiredData), isOtherRating])

  const additionalCommentsField = 'additional_comments'
  const additionalCommentsData = overviewData[additionalCommentsField] || []

  useEffect(() => {
    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      [additionalCommentsField]: isEmpty(additionalCommentsData)
        ? [submitRequiredMessage]
        : map(additionalCommentsData, (comment, index) => {
            const prevErrors = prev[additionalCommentsField]?.[index]
            const existingErrors = isPlainObject(prevErrors) ? prevErrors : {}
            let updatedErrors = { ...existingErrors }

            if (!comment.entity) {
              updatedErrors = { ...updatedErrors, entity: [requiredMessage] }
            } else if (existingErrors.entity?.includes(requiredMessage)) {
              updatedErrors = omit(updatedErrors, ['entity'])
            }

            if (!comment.comment?.trim()) {
              updatedErrors = {
                ...updatedErrors,
                comment: [submitRequiredMessage],
              }
            } else if (
              existingErrors.comment?.includes(submitRequiredMessage)
            ) {
              updatedErrors = omit(updatedErrors, ['comment'])
            }

            return normalizeErrors(updatedErrors)
          }),
    }))
  }, [JSON.stringify(additionalCommentsData)])

  const projectIds = map(pcrMetaproject.data?.projects, 'id')
  const summaryOfKeyData = PCRData.summary_of_key_data || []

  useEffect(() => {
    const summaryProjectIds = map(summaryOfKeyData, 'project_id')
    const missingProjectIds = filter(
      projectIds,
      (id) => !summaryProjectIds.includes(id),
    )

    if (missingProjectIds.length > 0) {
      setPCRData((prevData) => ({
        ...prevData,
        summary_of_key_data: [
          ...(prevData.summary_of_key_data || []),
          ...map(missingProjectIds, createSummaryData),
        ],
      }))
    }
  }, [
    JSON.stringify(projectIds),
    JSON.stringify(map(summaryOfKeyData, 'project_id')),
  ])

  const notApprovedProjectIds = map(
    filter(pcrMetaproject.data?.projects, isProjectNotApproved),
    'id',
  )

  useEffect(() => {
    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      [summaryOfKeyDataField]: map(summaryOfKeyData, (project, index) =>
        getSummaryOfKeyDataErrors(
          project,
          prev[summaryOfKeyDataField]?.[index],
          notApprovedProjectIds.includes(project.project_id),
        ),
      ),
    }))
  }, [JSON.stringify(summaryOfKeyData), JSON.stringify(notApprovedProjectIds)])

  const resultsAssessmentData = PCRData.results_assessment || []

  useEffect(() => {
    const activitiesData = flatMap(
      resultsAssessmentData,
      ({ overall_assessment_highlights }) => overall_assessment_highlights,
    )

    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      overall_assessment_highlights: map(activitiesData, (activity, index) =>
        normalizeErrors(
          reduce(
            keys(initialActivitiesData) as (keyof typeof activity)[],
            (acc, field) => setRequiredError(acc, field, activity[field]),
            prev.overall_assessment_highlights?.[index] ?? {},
          ),
        ),
      ),
    }))
  }, [JSON.stringify(resultsAssessmentData)])

  const causesOfDelayData = PCRData.delay_causes || []

  useEffect(() => {
    const cdData = flatMap(
      causesOfDelayData,
      ({ causes_of_delay }) => causes_of_delay,
    )

    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      [delayField]: map(cdData, (cd, index) => {
        const cdIdField = 'delay_cluster_id'

        const existingErrors = prev[delayField]?.[index] ?? {}
        let updatedErrors = { ...existingErrors }

        if (!cd[cdIdField]) {
          updatedErrors[cdIdField] = [requiredMessage]
        } else if (updatedErrors[cdIdField]?.includes(requiredMessage)) {
          updatedErrors = omit(updatedErrors, [cdIdField])
        }

        updatedErrors[dcField] = isEmpty(cd[dcField])
          ? [submitRequiredMessage]
          : map(cd[dcField], (rootCause, rootCauseIndex) => {
              const prevRootCauseErrors =
                existingErrors[dcField]?.[rootCauseIndex]

              return reduce(
                ['description_roots_causes_of_delay', 'action_taken'] as const,
                (acc, field) => setRequiredError(acc, field, rootCause[field]),
                isPlainObject(prevRootCauseErrors) ? prevRootCauseErrors : {},
              )
            })

        return normalizeErrors(updatedErrors)
      }),
    }))
  }, [JSON.stringify(causesOfDelayData)])

  const lessonsLearnedData = PCRData.learned_lessons || []

  useEffect(() => {
    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      learned_lessons: map(lessonsLearnedData, (agencyData, index) => {
        const existingErrors = prev.learned_lessons?.[index] ?? {}

        return normalizeErrors({
          ...existingErrors,
          [llField]: map(agencyData[llField], (lesson, lessonIndex) =>
            setRequiredError(
              existingErrors[llField]?.[lessonIndex] ?? {},
              'description',
              lesson.description,
            ),
          ),
        })
      }),
    }))
  }, [JSON.stringify(lessonsLearnedData)])

  const recommendationsData = PCRData.future_project_recommendations || []

  useEffect(() => {
    const prData = flatMap(recommendationsData, (data) => data[prField])

    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      future_project_recommendations: map(prData, (recommendation, index) =>
        reduce(
          ['title', 'description'] as const,
          (acc, field) => setRequiredError(acc, field, recommendation[field]),
          prev.future_project_recommendations?.[index] ?? {},
        ),
      ),
    }))
  }, [JSON.stringify(recommendationsData)])

  const genderMainstreamingData = PCRData.gender_mainstreaming || []

  useEffect(() => {
    const ppData = flatMap(
      genderMainstreamingData,
      ({ gender_mainstreamings }) => gender_mainstreamings,
    )

    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      [ppField]: map(ppData, (pp, index) => {
        return reduce(
          [
            'project_preparation',
            'prefilled',
            'qualitative_description',
          ] as const,
          (acc, field) =>
            setRequiredError(
              acc,
              field,
              pp[field],
              field === 'project_preparation' ? requiredMessage : undefined,
            ),
          prev[ppField]?.[index] ?? {},
        )
      }),
    }))
  }, [JSON.stringify(genderMainstreamingData)])

  const sdgsContributionData = PCRData.sdgs_contribution || []

  useEffect(() => {
    setErrors((prev: Record<string, any[]>) => ({
      ...prev,
      [sdgsContributionField]: map(sdgsContributionData, (sdg, index) => {
        const explanationField = 'sdg_not_applying_explanation'

        const existingErrors = prev[sdgsContributionField]?.[index] ?? {}
        const updatedErrors: Record<string, any> = {
          ...(sdg.sdg_applying
            ? omit(existingErrors, [explanationField])
            : setRequiredError(
                existingErrors,
                explanationField,
                sdg[explanationField],
              )),
        }

        updatedErrors[sdgsField] = map(sdg[sdgsField], (goal, goalIndex) =>
          setRequiredError(
            existingErrors[sdgsField]?.[goalIndex] ?? {},
            'description',
            goal.description,
          ),
        )

        return normalizeErrors(updatedErrors)
      }),
    }))
  }, [JSON.stringify(sdgsContributionData)])

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

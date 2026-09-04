import { useContext, useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  PCRActionButtons,
  PCRResultsAssessmentData,
  PCRGenderMainstreamingData,
  PCRSupportingEvidencesData,
  FormattedSupportingEvidencesData,
} from '../interfaces'
import {
  buildPCRProjectPayload,
  formatAgencyData,
  getOtherOptionId,
  hasErrorMessage,
} from '../utils'
import { formatApiUrl } from '@ors/helpers'

import { filter, flatMap, map, omit, pick } from 'lodash'
import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'
import Cookies from 'js-cookie'

const PCRCreateActionButtons = ({ setIsLoading }: PCRActionButtons) => {
  const [_, setLocation] = useLocation()
  const {
    PCRData,
    errors,
    setErrors,
    pcrMetaproject,
    pcrDefaultData,
    ratingOptions,
  } = useContext(PCRDataContext)
  const metaProjectId = pcrMetaproject.data?.id
  const {
    overview,
    results_assessment,
    causes_of_delay,
    lessons_learned,
    gender_mainstreaming,
    sdgs_contribution,
    supporting_evidences,
  } = PCRData

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const hasOverviewDefaultErrors = hasErrorMessage(errors.overview)
  const hasResultsAssessmentDefaultErrors = hasErrorMessage(
    errors.results_assessment,
  )
  const hasCausesOfDelayDefaultErrors = hasErrorMessage(errors.causes_of_delay)
  const hasLessonsLearnedDefaultErrors = hasErrorMessage(errors.lessons_learned)
  const hasGenderMainstreamingDefaultErrors = hasErrorMessage(
    errors.gender_mainstreaming,
  )
  const hasSDGsDefaultErrors = hasErrorMessage(errors.sdgs_contribution)
  const hasEvidencesDefaultErrors = hasErrorMessage(errors.supporting_evidences)

  const isSaveDisabled =
    !metaProjectId ||
    hasOverviewDefaultErrors ||
    hasResultsAssessmentDefaultErrors ||
    hasCausesOfDelayDefaultErrors ||
    hasLessonsLearnedDefaultErrors ||
    hasGenderMainstreamingDefaultErrors ||
    hasSDGsDefaultErrors ||
    hasEvidencesDefaultErrors

  const createPCR = async () => {
    setIsLoading(true)

    try {
      if (!metaProjectId) {
        throw new Error('PCR metaproject data is not loaded.')
      }

      const overviewPrefilledData = {
        ...pick(pcrDefaultData.data, [
          'project_date_approved',
          'project_date_completion',
          'phase_out_ods_actual',
          'phase_out_ods_approved',
          'phase_out_co2_eq_t_actual',
          'phase_out_co2_eq_t_approved',
        ]),
        decision_ids: pcrDefaultData.data?.decisions,
      }

      const overviewData = {
        ...overview,
        rating_explanation_other:
          overview.rating === getOtherOptionId(ratingOptions)
            ? overview.rating_explanation_other
            : null,
      }

      const resultsAssessmentData = formatAgencyData<PCRResultsAssessmentData>(
        results_assessment,
        'activities',
      )

      const causesOfDelayProjectComponents = flatMap(
        causes_of_delay,
        ({ agency_id, project_components }) =>
          map(
            project_components,
            ({ project_component_option_id, delay_causes }) => ({
              agency_id,
              project_component_option_id,
              delay_causes,
              learned_lessons: [],
            }),
          ),
      )

      const lessonsLearnedProjectComponents = flatMap(
        lessons_learned,
        ({ agency_id, project_components }) =>
          map(
            project_components,
            ({ project_component_option_id, learned_lessons }) => ({
              agency_id,
              project_component_option_id,
              delay_causes: [],
              learned_lessons,
            }),
          ),
      )

      const projectComponentsData = [
        ...causesOfDelayProjectComponents,
        ...lessonsLearnedProjectComponents,
      ]

      const genderMainstreamingsData =
        formatAgencyData<PCRGenderMainstreamingData>(
          gender_mainstreaming,
          'gender_mainstreamings',
        )

      const sdgsContributionData = filter(
        sdgs_contribution,
        (sdg) => sdg.goals.length > 0,
      )

      const formattedSupportingEvidence =
        formatAgencyData<PCRSupportingEvidencesData>(
          supporting_evidences,
          'evidences',
        ) as FormattedSupportingEvidencesData[]

      const supportingEvidencesData = map(
        formattedSupportingEvidence,
        (evidence) => omit(evidence, 'file'),
      )

      const payload = {
        meta_project_id: metaProjectId,
        ...overviewPrefilledData,
        ...overviewData,
        activities: resultsAssessmentData,
        project_components: projectComponentsData,
        gender_mainstreamings: genderMainstreamingsData,
        sustainable_development_goals: sdgsContributionData,
        supporting_evidences: supportingEvidencesData,
        pcr_projects: PCRData.summary_of_key_data.map(buildPCRProjectPayload),
      }

      const formData = new FormData()
      formData.append('metadata', JSON.stringify(payload))
      formattedSupportingEvidence.forEach((evidence) => {
        formData.append('files', evidence.file)
      })

      const csrftoken = Cookies.get('csrftoken')

      const response = await fetch(
        formatApiUrl('api/project-completion-reports/'),
        {
          body: formData,
          headers: { ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}) },
          credentials: 'include',
          method: 'POST',
        },
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrors(data)

        throw data ?? { message: 'An error occurred' }
      }

      enqueueSnackbar(<>PCR created successfully.</>, {
        variant: 'success',
      })
      clearUpdatedFields()
      setLocation('/pcr')
    } catch (error) {
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation('/pcr')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <CancelLinkButton title="Cancel" href={null} onClick={onCancel} />
      <SubmitButton
        title="Create PCR"
        onSubmit={createPCR}
        isDisabled={isSaveDisabled}
        className="!py-2"
      />
      {isCancelModalOpen && (
        <CancelWarningModal
          mode="PCR creation"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </div>
  )
}

export default PCRCreateActionButtons

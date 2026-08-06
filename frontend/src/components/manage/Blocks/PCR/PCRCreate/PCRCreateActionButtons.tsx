import { useContext, useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRActionButtons, PCRResultsAssessmentData } from '../interfaces'
import {
  buildPCRProjectPayload,
  formatAgencyData,
  getOtherOptionId,
} from '../utils'
import { api } from '@ors/helpers'

import { flatMap, map, pick } from 'lodash'
import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'

const PCRCreateActionButtons = ({ setIsLoading }: PCRActionButtons) => {
  const [_, setLocation] = useLocation()
  const { PCRData, pcrMetaproject, pcrDefaultData, ratingOptions } =
    useContext(PCRDataContext)
  const metaProjectId = pcrMetaproject.data?.id
  const { overview, results_assessment, causes_of_delay, lessons_learned } =
    PCRData

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

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
        ({ agency_id, pcr_project_component }) =>
          map(pcr_project_component, (component) => ({
            agency_id,
            project_component_option_id:
              component.pcr_project_component_id ?? null,
            delay_causes: map(component.delay, (delay) => ({
              delay_id: delay.cause_of_delay_id,
              description: delay.description,
            })),
            learned_lessons: [],
          })),
      )

      const lessonsLearnedProjectComponents = flatMap(
        lessons_learned,
        ({ agency_id, pcr_project_component }) =>
          map(pcr_project_component, (component) => ({
            agency_id,
            project_component_option_id:
              component.pcr_project_component_id ?? null,
            delay_causes: [],
            learned_lessons: map(component.lesson, (lesson) => ({
              lesson_id: lesson.lesson_learned_id,
              description: lesson.description,
            })),
          })),
      )

      const projectComponentsData = [
        ...causesOfDelayProjectComponents,
        ...lessonsLearnedProjectComponents,
      ]

      const payload = {
        meta_project_id: metaProjectId,
        ...overviewPrefilledData,
        ...overviewData,
        activities: resultsAssessmentData,
        project_components: projectComponentsData,
        pcr_projects: PCRData.summary_of_key_data.map(buildPCRProjectPayload),
      }

      await api('api/project-completion-reports/', {
        data: {
          meta_project_id: metaProjectId,
          pcr_projects: PCRData.summary_of_key_data.map(buildPCRProjectPayload),
        },
        method: 'POST',
      })
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
        isDisabled={!metaProjectId}
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

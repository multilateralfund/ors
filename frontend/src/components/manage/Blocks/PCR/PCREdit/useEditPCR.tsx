import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { EditPCROptions } from '../interfaces'
import {
  getFormData,
  getSectionDataKeys,
  keepSectionFormMessages,
} from '../utils'
import { formatApiUrl } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import { useParams } from 'wouter'
import Cookies from 'js-cookie'

export const useEditPCR = (setIsLoading: (isLoading: boolean) => void) => {
  const { pcr_id } = useParams<Record<string, string>>()
  const {
    PCRData,
    setErrors,
    pcrMetaproject,
    pcrDefaultData,
    ratingOptions,
    clearUpdatedSections,
  } = useContext(PCRDataContext)
  const metaProjectId = pcrMetaproject.data?.id

  return async (
    showSuccess = true,
    section?: string,
    { pcrData = PCRData, onErrors }: EditPCROptions = {},
  ) => {
    setIsLoading(true)

    try {
      if (!pcr_id || !metaProjectId) {
        throw new Error('PCR id is not available.')
      }

      const formData = getFormData(
        pcrDefaultData,
        pcrData,
        metaProjectId,
        ratingOptions,
        section,
      )

      const csrftoken = Cookies.get('csrftoken')

      const response = await fetch(
        formatApiUrl(`api/project-completion-reports/${pcr_id}/`),
        {
          body: formData,
          headers: { ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}) },
          credentials: 'include',
          method: 'PATCH',
        },
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (onErrors) {
          onErrors(data ?? {})
        } else {
          setErrors(data, section)
        }

        throw data ?? { message: 'An error occurred' }
      }

      if (showSuccess) {
        enqueueSnackbar(
          <>{`PCR ${section ? 'section ' : ''}updated successfully.`}</>,
          { variant: 'success' },
        )
      }

      setErrors((prevErrors: Record<string, any[]>) =>
        keepSectionFormMessages(prevErrors, section),
      )

      clearUpdatedSections(section ? getSectionDataKeys(section) : undefined)

      return true
    } catch (error) {
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })

      return false
    } finally {
      setIsLoading(false)
    }
  }
}

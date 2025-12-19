'use client'

import { Dispatch, SetStateAction, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import CustomLink from '@ors/components/ui/Link/Link'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  PageTitle,
  RedirectBackButton,
  RelatedProjects,
  SubmitButton,
} from '../HelperComponents'
import { useGetAssociatedProjects } from '../hooks/useGetAssociatedProjects'
import { AssociatedProjectsType, RelatedProjectsType } from '../interfaces'
import { pluralizeWord } from '../utils'
import { api } from '@ors/helpers'

import { Box, CircularProgress, Typography } from '@mui/material'
import { capitalize, find, lowerCase } from 'lodash'
import { Redirect, useParams } from 'wouter'
import { FaCheck } from 'react-icons/fa6'

const ProjectsVersionChange = ({
  mode,
  associatedProjects = [],
  loaded,
  setAssociation,
}: {
  mode: string
  associatedProjects: RelatedProjectsType[] | undefined
  loaded: boolean
  setAssociation: Dispatch<SetStateAction<AssociatedProjectsType>>
}) => {
  const { project_id } = useParams<Record<string, string>>()
  const parsedProjectId = parseInt(project_id)

  const isSubmit = mode === 'submit'
  const formattedMode = isSubmit ? 'submitted' : 'recommended'
  const modeAction = isSubmit ? 'submission' : 'recommendation'

  const hasAssociatedProjects = associatedProjects.length > 1
  const formattedText = pluralizeWord(associatedProjects, 'project')

  const [isSaving, setIsSaving] = useState(false)
  const [hasSaveErrors, setHasSaveErrors] = useState<boolean>()

  const currentProject = find(
    associatedProjects,
    ({ id }) => id === parsedProjectId,
  )
  const { submission_status, title, editable } = currentProject || {}
  const isDraft = lowerCase(submission_status) === 'draft'
  const isSubmitted = lowerCase(submission_status) === 'submitted'
  const isValidStatus = mode === 'submit' ? isDraft : isSubmitted

  if (currentProject && !(isValidStatus && editable)) {
    return <Redirect to="/projects/listing" />
  }

  const hasErrors = find(associatedProjects, ({ errors }) => errors.length > 0)
  const isSaveSuccessful = hasSaveErrors === false

  const getErrors = () => {
    useGetAssociatedProjects(
      parsedProjectId,
      setAssociation,
      'only_components',
      true,
      true,
    )
  }

  const saveProjects = async () => {
    try {
      setIsSaving(true)
      await api(`api/projects/v2/${project_id}/${mode}/`, {
        method: 'POST',
      })

      setHasSaveErrors(false)
    } catch (error) {
      setHasSaveErrors(true)
      getErrors()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <HeaderTitle>
        <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
          <div className="flex flex-col">
            <RedirectBackButton />
            <div className="flex gap-2">
              <PageHeading>
                <PageTitle
                  pageTitle={`${capitalize(mode)} project`}
                  projectTitle={title ?? ''}
                />
              </PageHeading>
            </div>
          </div>
          <div className="ml-auto mt-auto flex items-center gap-2.5">
            <CancelLinkButton
              title="Cancel"
              href={`/projects/${project_id}/edit`}
            />
          </div>
        </div>
      </HeaderTitle>
      <Box className="flex flex-col gap-6 border border-solid border-primary p-6">
        {!isSaveSuccessful ? (
          <span className="text-[22px]">
            {hasErrors || hasSaveErrors
              ? `${hasAssociatedProjects ? 'Some projects need' : 'The project needs'} adjustments before ${modeAction}:`
              : `The following ${formattedText} will be ${formattedMode}:`}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[22px]">
            <div className="flex h-5 min-h-5 min-w-5 items-center justify-center rounded-full border border-solid border-primary bg-[#EBFF00]">
              <FaCheck className="text-primary" size={14} />
            </div>
            The following {formattedText}
            {hasAssociatedProjects ? ' have ' : ' has '}
            been successfully {formattedMode}:
          </span>
        )}
        <RelatedProjects
          data={associatedProjects}
          getErrors={getErrors}
          isLoaded={loaded}
          canRefreshStatus={!isSaveSuccessful && !!hasErrors}
        />
        {!isSaveSuccessful && (
          <div className="flex items-center gap-2">
            <SubmitButton
              title={mode}
              isDisabled={!!hasErrors || associatedProjects.length === 0}
              onSubmit={saveProjects}
              className="h-9 w-fit"
            />
            {isSaving && (
              <CircularProgress
                color="inherit"
                size="16px"
                className="ml-1.5"
              />
            )}
          </div>
        )}
        {hasSaveErrors && (
          <CustomAlert
            type="error"
            content={
              <Typography className="text-lg leading-none">
                An error occurred during the {formattedText} {modeAction}.
                Please check the {formattedText} and try again.
              </Typography>
            }
          />
        )}
        {isSaveSuccessful && (
          <CustomLink
            className="h-9 w-fit text-nowrap px-4 py-2 text-lg uppercase"
            href="/projects/listing"
            color="secondary"
            variant="contained"
            button
          >
            Projects
          </CustomLink>
        )}
      </Box>
    </>
  )
}

export default ProjectsVersionChange

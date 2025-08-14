'use client'

import { useState } from 'react'

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
import { RelatedProjectsType } from '../interfaces'
import { pluralizeWord } from '../utils'
import { api } from '@ors/helpers'

import { Box, CircularProgress, Typography } from '@mui/material'
import { Redirect, useParams } from 'wouter'
import { FaCheck } from 'react-icons/fa6'
import { find, lowerCase } from 'lodash'

const ProjectsSubmit = ({
  associatedProjects = [],
  loaded,
  setLoaded,
  setAssociatedProjects,
}: {
  associatedProjects: RelatedProjectsType[] | undefined
  loaded: boolean
  setLoaded: (loaded: boolean) => void
  setAssociatedProjects: (projects: RelatedProjectsType[] | null) => void
}) => {
  const { project_id } = useParams<Record<string, string>>()
  const parsedProjectId = parseInt(project_id)

  const hasAssociatedProjects = associatedProjects.length > 1
  const formattedText = pluralizeWord(associatedProjects, 'project')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitErrors, setHasSubmitErrors] = useState<boolean>()

  const currentProject = find(
    associatedProjects,
    ({ id }) => id === parsedProjectId,
  )
  const { submission_status, title, editable } = currentProject || {}
  const isDraft = lowerCase(submission_status) === 'draft'

  if (currentProject && !(isDraft && editable)) {
    return <Redirect to="/projects-listing/listing" />
  }

  const hasErrors = find(associatedProjects, ({ errors }) => errors.length > 0)
  const isSubmitSuccessful = hasSubmitErrors === false

  const getErrors = () => {
    useGetAssociatedProjects(
      parsedProjectId,
      setAssociatedProjects,
      setLoaded,
      'only_components',
      true,
      true,
    )
  }

  const submitProjects = async () => {
    try {
      setIsSubmitting(true)
      await api(`api/projects/v2/${project_id}/submit/`, {
        method: 'POST',
      })
      setHasSubmitErrors(false)
    } catch (error) {
      setHasSubmitErrors(true)
      getErrors()
    } finally {
      setIsSubmitting(false)
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
                  pageTitle="Submit project"
                  projectTitle={title ?? ''}
                />
              </PageHeading>
            </div>
          </div>
          <div className="ml-auto mt-auto flex items-center gap-2.5">
            <CancelLinkButton
              title="Cancel"
              href={`/projects-listing/${project_id}/edit`}
            />
          </div>
        </div>
      </HeaderTitle>
      <Box className="flex flex-col gap-6 border border-solid border-primary p-6">
        {!isSubmitSuccessful ? (
          <span className="text-[22px]">
            {hasErrors || hasSubmitErrors
              ? `${hasAssociatedProjects ? 'Some associated projects need' : 'A project needs'} adjustments before submission:`
              : `The following ${hasAssociatedProjects ? 'associated' : ''} ${formattedText} will be submitted:`}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[22px]">
            <div className="flex h-5 min-h-5 min-w-5 items-center justify-center rounded-full border border-solid border-primary bg-[#EBFF00]">
              <FaCheck className="text-primary" size={14} />
            </div>
            The following {formattedText}
            {hasAssociatedProjects ? ' have ' : ' has '}
            been successfully submitted:
          </span>
        )}
        <RelatedProjects
          data={associatedProjects}
          getErrors={getErrors}
          isLoaded={loaded}
          canRefreshStatus={!isSubmitSuccessful}
        />
        {!isSubmitSuccessful && (
          <div className="flex items-center gap-2">
            <SubmitButton
              title="Submit"
              isDisabled={!!hasErrors}
              onSubmit={submitProjects}
              className="h-9 w-fit"
            />
            {isSubmitting && (
              <CircularProgress
                color="inherit"
                size="16px"
                className="ml-1.5"
              />
            )}
          </div>
        )}
        {hasSubmitErrors && (
          <CustomAlert
            type="error"
            content={
              <Typography className="text-lg leading-none">
                An error occurred during the {formattedText} submission. Please
                check the {formattedText} and try again.
              </Typography>
            }
          />
        )}
        {isSubmitSuccessful && (
          <CustomLink
            className="h-9 w-fit text-nowrap px-4 py-2 text-lg uppercase"
            href="/projects-listing/listing"
            color="secondary"
            variant="contained"
            button
          >
            Projects listing
          </CustomLink>
        )}
      </Box>
    </>
  )
}

export default ProjectsSubmit

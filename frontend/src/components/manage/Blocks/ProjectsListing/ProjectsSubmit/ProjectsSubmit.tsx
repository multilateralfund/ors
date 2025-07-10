'use client'

import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import ErrorAlert from '@ors/components/theme/Alerts/ErrorAlert'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  PageTitle,
  RedirectBackButton,
  RelatedProjects,
  SubmitButton,
} from '../HelperComponents'
import { useGetProjectsForSubmission } from '../hooks/useGetProjectsForSubmission'
import { RelatedProjectsType } from '../interfaces'
import { api } from '@ors/helpers'

import { Box, CircularProgress, Typography } from '@mui/material'
import { Redirect, useParams } from 'wouter'
import { find, lowerCase } from 'lodash'

const ProjectsSubmit = ({
  associatedProjects,
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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitErrors, setHasSubmitErrors] = useState<boolean>()

  const currentProject = find(
    associatedProjects,
    ({ id }) => id === parsedProjectId,
  )
  const { submission_status, title, version } = currentProject || {}
  const isDraft = lowerCase(submission_status) === 'draft'

  if (currentProject && (!isDraft || (isDraft && version === 2))) {
    return <Redirect to="/projects-listing" />
  }

  const hasErrors = find(associatedProjects, ({ errors }) => errors.length > 0)
  const isSubmitSuccessful = hasSubmitErrors === false

  const getErrors = () => {
    useGetProjectsForSubmission(
      parsedProjectId,
      setAssociatedProjects,
      setLoaded,
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
        <div className="align-center flex flex-col flex-wrap justify-between">
          <RedirectBackButton />
          <PageHeading className="min-w-fit">
            <PageTitle pageTitle="Submit project" projectTitle={title ?? ''} />
          </PageHeading>
        </div>
      </HeaderTitle>
      <Box className="flex flex-col gap-6 border border-solid border-primary p-6">
        {!isSubmitSuccessful ? (
          <span className="text-[22px]">
            {hasErrors || hasSubmitErrors
              ? 'Some associated projects need adjustments before submission:'
              : 'The following associated projects will be submitted:'}
          </span>
        ) : (
          <span className="text-[22px]">
            The following projects have been successfully submitted:
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
          <ErrorAlert
            content={
              <Typography className="text-lg leading-none">
                An error occurred during projects' submission. Please check the
                projects and try again.
              </Typography>
            }
          />
        )}
        {isSubmitSuccessful && (
          <CustomLink
            className="h-9 w-fit text-nowrap px-4 py-2 text-lg uppercase"
            href={`/projects-listing`}
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

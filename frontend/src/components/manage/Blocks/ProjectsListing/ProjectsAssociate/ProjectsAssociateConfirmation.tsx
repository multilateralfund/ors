'use client'

import { useContext, useEffect, useRef, useState } from 'react'

import { PageHeading } from '@ors/components/ui/Heading/Heading'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PListingTable from '../ProjectsListing/PListingTable'
import { SubmitButton } from '../HelperComponents'
import { useGetProjects } from '../hooks/useGetProjects'
import { useGetAssociatedProjects } from '../hooks/useGetAssociatedProjects'
import { AssociatedProjectsType, ProjectTypeApi } from '../interfaces'
import { defaultProps, initialFilters } from '../constants'
import useApi from '@ors/hooks/useApi'
import { api } from '@ors/helpers'

import { Button, Typography } from '@mui/material'
import { debounce, filter, map } from 'lodash'
import { enqueueSnackbar } from 'notistack'

const MetaProjectSelection = ({
  crtProjects,
  associatedProjects,
}: {
  crtProjects: ProjectTypeApi[]
  associatedProjects: ProjectTypeApi[]
}) => {
  const { data: firstMetaproject, loading: firstMetaprojectLoading } = useApi({
    options: {},
    path: `api/meta-projects/${crtProjects[0].meta_project_id}`,
  })

  const { data: secondMetaproject, loading: secondMetaprojectLoading } = useApi(
    {
      options: {},
      path: `api/meta-projects/${associatedProjects[0].meta_project_id}`,
    },
  )

  const loading = firstMetaprojectLoading || secondMetaprojectLoading

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && <div></div>}
    </>
  )
}

const ProjectsAssociateConfirmation = ({
  crtProjects = [],
  projectsAssociation,
  associationIds,
  cancelAssociation,
}: {
  crtProjects: ProjectTypeApi[]
  projectsAssociation: ReturnType<typeof useGetProjects>
  associationIds: number[]
  cancelAssociation: () => void
}) => {
  const form = useRef<any>()
  const { agencies } = useContext(ProjectsDataContext)

  const [errors, setErrors] = useState(null)
  const [finalMetaCode, setFinalMetaCode] = useState(null)
  const [association, setAssociation] = useState<AssociatedProjectsType>({
    projects: [],
    loaded: false,
  })
  const { projects: associationProjects, loaded: loadedAssociatedProjects } =
    association
  const associatedProjects = associationProjects || []

  const debouncedGetAssociatedProjects = debounce(() => {
    useGetAssociatedProjects(
      associationIds[0],
      setAssociation,
      'all',
      false,
      true,
      false,
    )
  }, 0)

  useEffect(() => {
    debouncedGetAssociatedProjects()
  }, [])

  const projects = {
    ...projectsAssociation,
    results: [...crtProjects, ...associatedProjects],
  }

  const isOriginalProjIndiv = crtProjects.length === 1
  const isAssociatedProjIndiv = associatedProjects.length === 1
  const onlyIndivProjects = isOriginalProjIndiv && isOriginalProjIndiv

  const originalProjLeadAgencyId = crtProjects[0].lead_agency
  const associatedProjLeadAgencyId = loadedAssociatedProjects
    ? associatedProjects[0].lead_agency
    : null

  const leadAgencyIds: (number | null)[] = [
    ...(onlyIndivProjects
      ? [originalProjLeadAgencyId, associatedProjLeadAgencyId]
      : isOriginalProjIndiv
        ? [associatedProjLeadAgencyId]
        : isAssociatedProjIndiv
          ? [originalProjLeadAgencyId]
          : []),
  ]

  const leadAgencyOpts = filter(agencies, ({ id }) =>
    leadAgencyIds.includes(id),
  )

  const formattedLeadAgencyOpts =
    leadAgencyOpts.length === 0 ? agencies : leadAgencyOpts

  const [leadAgencyId, setLeadAgencyId] = useState<number | null>(null)

  useEffect(() => {
    if (loadedAssociatedProjects && formattedLeadAgencyOpts.length === 1) {
      setLeadAgencyId(formattedLeadAgencyOpts[0].id)
    }
  }, [leadAgencyOpts])

  const fieldProps = {
    ...defaultProps,
    FieldProps: {
      className: defaultProps.FieldProps.className + ' ProjAssociation',
    },
  }

  const associateProjects = async () => {
    setErrors(null)

    try {
      const response = await api(`api/projects/v2/associate_projects/`, {
        data: {
          projects_to_associate: map(projects.results, 'id'),
          lead_agency_id: leadAgencyId,
        },
        method: 'POST',
      })

      setFinalMetaCode(response.umbrella_code)
    } catch (error) {
      setFinalMetaCode(null)

      const errors = await error.json()

      if (error.status === 400) {
        setErrors(errors?.error)
      }

      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <PageHeading className="min-w-fit">
            Associate projects - confirm details
          </PageHeading>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              className="h-9 border border-solid border-primary bg-white px-4 py-2 text-primary shadow-none"
              color="primary"
              size="large"
              variant="contained"
              onClick={cancelAssociation}
            >
              Cancel
            </Button>
            <SubmitButton
              title="Submit"
              isDisabled={
                !(leadAgencyId && loadedAssociatedProjects) || !!finalMetaCode
              }
              onSubmit={associateProjects}
              className="h-9"
            />
          </div>
        </div>
        <p className="my-0">
          The following projects will be grouped together. Please select a lead
          agency or verify that it has been correctly selected.
        </p>
      </div>
      <div>
        {isOriginalProjIndiv &&
          loadedAssociatedProjects &&
          !isAssociatedProjIndiv && (
            <CustomAlert
              type="info"
              alertClassName="mb-2 px-2 py-0"
              content={
                <Typography className="text-lg leading-5">
                  The project{' '}
                  {associatedProjects[0].code ??
                    associatedProjects[0].code_legacy}{' '}
                  is already associated with the meta-project{' '}
                  {associatedProjects[0].umbrella_code}, therefore the project{' '}
                  {crtProjects[0].code ?? crtProjects[0].code_legacy} will be
                  part of this umbrella.
                </Typography>
              }
            />
          )}
        {loadedAssociatedProjects && !onlyIndivProjects && (
          <CustomAlert
            type="info"
            alertClassName="mb-2 px-2 py-0"
            content={
              <Typography className="text-lg leading-5">
                The project you are trying to associate and the one to be
                associated with are part of different meta-projects. If you
                would like to continue, please choose the meta-project that
                these projects will belong to:
              </Typography>
            }
          />
        )}
        <Label>Lead agency</Label>
        <Field
          widget="autocomplete"
          options={leadAgencyOpts}
          value={leadAgencyId}
          onChange={(_, value: any) => {
            setLeadAgencyId(value?.id ?? null)
          }}
          getOptionLabel={(option) => getOptionLabel(leadAgencyOpts, option)}
          {...fieldProps}
        />
        {loadedAssociatedProjects && !onlyIndivProjects && (
          <MetaProjectSelection {...{ crtProjects, associatedProjects }} />
        )}
      </div>
      <form className="flex flex-col gap-6" ref={form}>
        <PListingTable
          mode="association"
          filters={initialFilters}
          enablePagination={false}
          {...{ projects, associationIds }}
        />
      </form>
      {errors && (
        <CustomAlert
          type="error"
          alertClassName="mb-5"
          content={<Typography className="text-lg">{errors}</Typography>}
        />
      )}
      {finalMetaCode && (
        <CustomAlert
          type="success"
          alertClassName="BPAlert mt-4"
          content={
            <Link
              className="text-xl text-inherit no-underline"
              href="/projects-listing/listing"
            >
              <p className="m-0 mt-0.5 text-lg">
                Projects were associated in meta-project {finalMetaCode}.{' '}
                <span className="underline">View projects.</span>
              </p>
            </Link>
          }
        />
      )}
    </>
  )
}

export default ProjectsAssociateConfirmation

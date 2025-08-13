'use client'

import { useContext, useRef, useState } from 'react'

import { PageHeading } from '@ors/components/ui/Heading/Heading'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { initialParams } from '../ProjectsListing/ProjectsFiltersSelectedOpts'
import PListingTable from '../ProjectsListing/PListingTable'
import { SubmitButton } from '../HelperComponents'
import { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import { defaultProps, initialFilters } from '../constants'
import { ProjectTypeApi } from '../interfaces'
import { useStore } from '@ors/store'
import { api } from '@ors/helpers'

import { filter, find, flatMap, map } from 'lodash'
import { Button, Typography } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'

const ProjectsAssociateConfirmation = ({
  crtProjects,
  projectsAssociation,
  associationIds,
  setAssociationIds,
  setFilters,
  setMode,
}: {
  crtProjects: ProjectTypeApi[]
  projectsAssociation: ReturnType<typeof useGetProjectsAssociation>
  associationIds: number[]
  setAssociationIds: (ids: number[]) => void
  setFilters: (filters: any) => void
  setMode: (mode: string) => void
}) => {
  const form = useRef<any>()
  const [_, setLocation] = useLocation()
  const { canAssociateProjects } = useContext(PermissionsContext)

  const commonSlice = useStore((state) => state.common)
  const agencies = commonSlice.agencies.data

  const [errors, setErrors] = useState(null)

  const { setParams, results = [] } = projectsAssociation

  const metaProjects = results.filter(({ projects }) =>
    find(projects, ({ id }) => associationIds.includes(id)),
  )
  const metaProjectsLeadAgenciesIds = map(metaProjects, 'lead_agency_id')
  const leadAgencyOptions = filter(
    agencies,
    ({ id }) =>
      metaProjectsLeadAgenciesIds.includes(id) ||
      id === crtProjects[0]?.meta_project?.lead_agency,
  )

  const [leadAgencyId, setLeadAgencyId] = useState(
    leadAgencyOptions.length === 1 ? leadAgencyOptions[0].id : null,
  )

  const selectedProjects = [
    ...crtProjects,
    ...flatMap(metaProjects, (metaProject) => metaProject.projects),
  ]
  const projects = { ...projectsAssociation, results: selectedProjects }

  const fieldProps = {
    ...defaultProps,
    FieldProps: {
      className: defaultProps.FieldProps.className + ' ProjAssociation',
    },
  }

  const associateProjects = async () => {
    setErrors(null)

    try {
      await api(`api/projects/v2/associate_projects/`, {
        data: {
          project_ids: map(projects.results, 'id'),
          lead_agency_id: leadAgencyId,
        },
        method: 'POST',
      })

      setLocation(`/projects-listing`)
    } catch (error) {
      const errors = await error.json()

      if (error.status === 400) {
        setErrors(errors?.error)
      }

      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  const cancelAssociation = () => {
    setMode('selection')
    setAssociationIds([])
    setFilters({ offset: 0, ...initialParams })
    setParams({ ...initialFilters, ...initialParams })
  }

  return (
    <>
      <div className="mt-2 flex flex-col gap-2">
        <PageHeading className="min-w-fit">
          Associate projects - confirm details
        </PageHeading>
        <p className="my-0">
          The following projects will be grouped together. Please select a lead
          agency or verify that it has been correctly selected.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <Label>Lead agency</Label>
          <Field
            widget="autocomplete"
            options={leadAgencyOptions}
            value={leadAgencyId}
            onChange={(_, value: any) => {
              setLeadAgencyId(value?.id ?? null)
            }}
            getOptionLabel={(option) =>
              getOptionLabel(leadAgencyOptions, option)
            }
            {...fieldProps}
          />
        </div>
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
          {canAssociateProjects && (
            <SubmitButton
              title="Submit"
              isDisabled={!leadAgencyId}
              onSubmit={associateProjects}
              className="h-9"
            />
          )}
        </div>
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
    </>
  )
}

export default ProjectsAssociateConfirmation

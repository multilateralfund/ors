'use client'

import { useContext, useEffect, useRef, useState } from 'react'

import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ViewTable from '@ors/components/manage/Form/ViewTable'
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
import { getFormattedDate, getFormattedNumericValue } from '../utils'
import {
  defaultProps,
  initialFilters,
  metaProjectSelectionFields,
} from '../constants'
import useApi from '@ors/hooks/useApi'
import { api } from '@ors/helpers'

import { Button, Checkbox, Typography } from '@mui/material'
import { debounce, filter, map } from 'lodash'
import { enqueueSnackbar } from 'notistack'

type MetaProjectType = {
  metaproject_id: number | null
  lead_agency_id: number | null
}

const MetaProjectSelection = ({
  crtProjects,
  associatedProjects,
  metaProjectData,
  setMetaProjectData,
  setLeadAgencyId,
}: {
  crtProjects: ProjectTypeApi[]
  associatedProjects: ProjectTypeApi[]
  metaProjectData: MetaProjectType
  setMetaProjectData: (metaProjectData: MetaProjectType) => void
  setLeadAgencyId: (leadAgencyId: number | null) => void
}) => {
  const { data: firstMetaproject = {}, loading: firstMetaprojectLoading } =
    useApi({
      options: {
        withStoreCache: false,
      },
      path: `api/meta-projects/${crtProjects[0].meta_project_id}`,
    })

  const { data: secondMetaproject = {}, loading: secondMetaprojectLoading } =
    useApi({
      options: {
        withStoreCache: false,
      },
      path: `api/meta-projects/${associatedProjects[0].meta_project_id}`,
    })

  const loading = firstMetaprojectLoading || secondMetaprojectLoading

  const metaProjects = [firstMetaproject, secondMetaproject].map(
    (metaProject, index) => {
      const umbrella_code = metaProject.umbrella_code ?? 'N/A'
      const project_code =
        index === 0
          ? (crtProjects[0].code ?? crtProjects[0].code_legacy)
          : (associatedProjects[0].code ?? associatedProjects[0].code_legacy)
      const lead_agency_name = metaProject.lead_agency
        ? metaProject.lead_agency.name
        : '-'
      const computedData = metaProject.computed_field_data || {}

      return {
        ...metaProject,
        umbrella_code,
        project_code,
        lead_agency_name,
        start_date: getFormattedDate(computedData.start_date),
        end_date: getFormattedDate(computedData.end_date),
        project_funding: getFormattedNumericValue(computedData.project_funding),
        support_cost: getFormattedNumericValue(computedData.support_cost),
      }
    },
  )

  const rowData = metaProjectSelectionFields.map((field) => ({
    label: field.label,
    ...Object.fromEntries(
      metaProjects.map((metaProject) => [
        metaProject.id,
        {
          label: field.label,
          value: metaProject[field.key],
        },
      ]),
    ),
  }))

  const MetaProjectHeader = ({
    metaProject: { id, project_code, lead_agency },
  }: {
    metaProject: {
      id: number
      project_code: string
      lead_agency: { id: number | null }
    }
  }) => (
    <div className="flex items-center">
      <Checkbox
        checked={id === metaProjectData.metaproject_id}
        onChange={(event) => {
          const isChecked = event.target.checked
          const leadAgencyId = isChecked ? (lead_agency?.id ?? null) : null

          setMetaProjectData({
            metaproject_id: isChecked ? id : null,
            lead_agency_id: leadAgencyId,
          })
          setLeadAgencyId(leadAgencyId)
        }}
        sx={{ color: 'inherit', '&.Mui-checked': { color: 'inherit' } }}
      />
      <div>{project_code}</div>
    </div>
  )

  const columnDefs = [
    ...metaProjects.map((metaProject) => ({
      headerComponent: MetaProjectHeader,
      headerComponentParams: { metaProject },
      field: String(metaProject.id),
      cellRenderer: (params: any) => {
        const { label, value } = params.value || {}
        return (
          <span>
            <span className="font-bold">{label}:</span> {value}
          </span>
        )
      },
    })),
  ]

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && (
        <div className="mt-5 max-w-[600px]">
          <ViewTable
            className="metaproject-selection-table"
            domLayout="autoHeight"
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{
              headerClass: 'pl-0 ag-header-cell-ellipsed',
              cellClass: 'ag-cell-ellipsed !pl-2',
              minWidth: 150,
              resizable: false,
              sortable: false,
            }}
            suppressScrollOnNewData={true}
            resizeGridOnRowUpdate={true}
            components={{
              agColumnHeader: undefined,
              agTextCellRenderer: undefined,
            }}
          />
        </div>
      )}
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

  const [metaProjectData, setMetaProjectData] = useState<MetaProjectType>({
    metaproject_id: null,
    lead_agency_id: null,
  })
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

  const isOriginalProjIndiv = !crtProjects[0].meta_project_id
  const isAssociatedProjIndiv =
    associatedProjects.length > 0 && !associatedProjects[0].meta_project_id
  const onlyMetaProjects = !(isOriginalProjIndiv || isAssociatedProjIndiv)

  const [leadAgencyId, setLeadAgencyId] = useState<number | null>(null)

  const originalProjLeadAgencyId = crtProjects[0].lead_agency
  const associatedProjLeadAgencyId = loadedAssociatedProjects
    ? associatedProjects[0].lead_agency
    : null

  const leadAgencyIds: (number | null)[] = [
    ...(isOriginalProjIndiv && isAssociatedProjIndiv
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

  useEffect(() => {
    if (loadedAssociatedProjects && leadAgencyOpts.length === 1) {
      setLeadAgencyId(leadAgencyOpts[0].id)
    }
  }, [loadedAssociatedProjects, leadAgencyOpts])

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
          ...(!!metaProjectData.metaproject_id
            ? { meta_project_id: metaProjectData.metaproject_id }
            : {}),
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
                !(leadAgencyId && loadedAssociatedProjects) ||
                !!finalMetaCode ||
                (onlyMetaProjects &&
                  !(
                    !!metaProjectData.metaproject_id &&
                    !!metaProjectData.lead_agency_id
                  ))
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
        {loadedAssociatedProjects && onlyMetaProjects && (
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
          options={agencies}
          value={leadAgencyId}
          onChange={(_, value: any) => {
            setLeadAgencyId(value?.id ?? null)
          }}
          getOptionLabel={(option) => getOptionLabel(agencies, option)}
          {...fieldProps}
        />
        {loadedAssociatedProjects && onlyMetaProjects && (
          <MetaProjectSelection
            {...{
              crtProjects,
              associatedProjects,
              metaProjectData,
              setMetaProjectData,
              setLeadAgencyId,
            }}
          />
        )}
      </div>
      <p className="my-0 text-[22px]">Projects for association:</p>
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

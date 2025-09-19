import { ChangeEvent } from 'react'

import Field from '@ors/components/manage/Form/Field'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { DateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { SectionTitle } from './ProjectsCreate'
import { changeField, changeHandler } from './SpecificFieldsHelpers'
import { canEditField, canViewField, hasFields } from '../utils'
import {
  tableColumns,
  lvcNonLvcOpts,
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
  disabledClassName,
} from '../constants'
import {
  CrossCuttingFields,
  BooleanOptionsType,
  ProjectDataProps,
  ProjectData,
} from '../interfaces'
import { ProjectTypeType } from '@ors/types/api_project_types'
import { ProjectSectorType } from '@ors/types/api_project_sector'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector.ts'
import { useStore } from '@ors/store'

import { TextareaAutosize, Divider, Checkbox } from '@mui/material'
import { filter, find, includes, some } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'

const ProjectCrossCuttingFields = ({
  projectData,
  setProjectData,
  errors = {},
  hasSubmitted,
  fieldsOpts,
  specificFieldsLoaded,
}: ProjectDataProps & {
  specificFieldsLoaded: boolean
  fieldsOpts: {
    crtProjectTypesOpts: ProjectTypeType[]
    projectTypes: ProjectTypeType[]
    crtSectorsOpts: ProjectSectorType[]
    sectors: ProjectSectorType[]
    crtSubsectorsOpts: ProjectSubSectorType[]
    subsectors: ProjectSubSectorType[]
  }
}) => {
  const {
    crtProjectTypesOpts,
    projectTypes,
    crtSectorsOpts,
    sectors,
    crtSubsectorsOpts,
    subsectors,
  } = fieldsOpts
  const sectionIdentifier = 'crossCuttingFields'
  const crossCuttingFields = projectData[sectionIdentifier]
  const {
    project_type,
    sector,
    subsector_ids,
    is_lvc,
    title,
    description,
    total_fund,
    support_cost_psc,
    project_start_date,
    project_end_date,
    individual_consideration,
  } = crossCuttingFields

  const { projectFields, viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const canViewAboutSection =
    canViewField(viewableFields, 'title') ||
    canViewField(viewableFields, 'description')
  const canViewDetailsSection = hasFields(
    projectFields,
    viewableFields,
    'Cross-Cutting',
    false,
    ['title', 'description'],
  )

  const sectionDefaultProps = {
    ...defaultProps,
    FieldProps: {
      className: defaultProps.FieldProps.className + ' w-[15rem]',
    },
  }
  const defaultPropsDateInput = {
    className: 'BPListUpload !ml-0 h-10 w-40',
  }

  const handleChangeSubSector = (subsectors: ProjectSubSectorType[]) => {
    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        subsector_ids: subsectors.map((subsector) => subsector.id) ?? [],
      },
    }))
  }

  const handleChangeNumericValues = (
    event: ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const initialValue = event.target.value
    const value = initialValue === '' ? null : initialValue

    if (!isNaN(Number(value))) {
      setProjectData((prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          [field]: value,
        },
      }))
    } else {
      event.preventDefault()
    }
  }

  const handleChangeBlanketConsideration = (consideration: boolean) => {
    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        individual_consideration: !consideration,
      },
    }))
  }

  const getIsInputDisabled = (field: keyof typeof errors) =>
    hasSubmitted && errors[field]?.length > 0

  const getFieldDefaultProps = (field: string) => {
    return {
      ...{
        ...defaultPropsSimpleField,
        className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1', {
          'border-red-500': getIsInputDisabled(field),
          [disabledClassName]: !canEditField(editableFields, field),
        }),
      },
    }
  }

  return (
    <>
      {canViewAboutSection && (
        <>
          <SectionTitle>About</SectionTitle>
          {canViewField(viewableFields, 'title') && (
            <div>
              <Label>{tableColumns.title}</Label>
              <SimpleInput
                id={title}
                value={title}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  changeHandler['text']<ProjectData, CrossCuttingFields>(
                    event,
                    'title',
                    setProjectData,
                    sectionIdentifier,
                  )
                }
                disabled={!canEditField(editableFields, 'title')}
                type="text"
                {...getFieldDefaultProps('title')}
                containerClassName={
                  defaultPropsSimpleField.containerClassName +
                  ' w-full max-w-[55rem]'
                }
              />
            </div>
          )}
          {canViewField(viewableFields, 'description') && (
            <div>
              <Label>{tableColumns.description}</Label>
              <TextareaAutosize
                value={description}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  changeHandler['text']<ProjectData, CrossCuttingFields>(
                    event,
                    'description',
                    setProjectData,
                    sectionIdentifier,
                  )
                }
                disabled={!canEditField(editableFields, 'description')}
                className={cx(textAreaClassname + ' max-w-[64rem]', {
                  'border-red-500': getIsInputDisabled('description'),
                })}
                minRows={7}
                tabIndex={-1}
              />
            </div>
          )}
        </>
      )}

      {canViewAboutSection && canViewDetailsSection && (
        <Divider className="my-6" />
      )}

      {canViewDetailsSection && (
        <>
          <SectionTitle>Details</SectionTitle>
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-wrap gap-x-20 gap-y-3">
              {canViewField(viewableFields, 'project_type') && (
                <div>
                  <Label>{tableColumns.type}</Label>
                  <Field
                    widget="autocomplete"
                    options={crtProjectTypesOpts}
                    value={
                      some(projectTypes, { id: project_type })
                        ? project_type
                        : null
                    }
                    onChange={(_: React.SyntheticEvent, value) =>
                      changeHandler['drop_down']<
                        ProjectData,
                        CrossCuttingFields
                      >(
                        value,
                        'project_type',
                        setProjectData,
                        sectionIdentifier,
                      )
                    }
                    getOptionLabel={(option: any) =>
                      getOptionLabel(projectTypes, option)
                    }
                    disabled={
                      !specificFieldsLoaded ||
                      !canEditField(editableFields, 'project_type')
                    }
                    Input={{
                      error: getIsInputDisabled('project_type'),
                    }}
                    {...sectionDefaultProps}
                  />
                </div>
              )}
              {canViewField(viewableFields, 'sector') && (
                <div>
                  <Label>{tableColumns.sector}</Label>
                  <Field
                    widget="autocomplete"
                    options={crtSectorsOpts}
                    value={some(sectors, { id: sector }) ? sector : null}
                    onChange={(_, value) =>
                      changeHandler['drop_down']<
                        ProjectData,
                        CrossCuttingFields
                      >(value, 'sector', setProjectData, sectionIdentifier)
                    }
                    getOptionLabel={(option) => getOptionLabel(sectors, option)}
                    disabled={
                      !specificFieldsLoaded ||
                      !canEditField(editableFields, 'sector')
                    }
                    Input={{
                      error: getIsInputDisabled('sector'),
                    }}
                    {...sectionDefaultProps}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-x-20 gap-y-3">
              {canViewField(viewableFields, 'subsectors') && (
                <div className="w-full max-w-[40rem] flex-shrink">
                  <Label>{tableColumns.subsectors}</Label>
                  <Field
                    widget="autocomplete"
                    multiple={true}
                    options={crtSubsectorsOpts}
                    value={
                      filter(subsectors, (subsector) =>
                        includes(subsector_ids, subsector.id),
                      ) as ProjectSubSectorType[]
                    }
                    onChange={(_, value) =>
                      handleChangeSubSector(value as ProjectSubSectorType[])
                    }
                    getOptionLabel={(option) =>
                      getOptionLabel(subsectors, option)
                    }
                    disabled={!canEditField(editableFields, 'subsectors')}
                    Input={{
                      error: getIsInputDisabled('subsector_ids'),
                    }}
                    FieldProps={{
                      className: 'mb-0 w-full BPListUpload',
                    }}
                  />
                </div>
              )}
              {canViewField(viewableFields, 'is_lvc') && (
                <div>
                  <Label>{tableColumns.is_lvc}</Label>
                  <Field
                    widget="autocomplete"
                    options={lvcNonLvcOpts}
                    value={
                      (find(lvcNonLvcOpts, { id: is_lvc }) ||
                        null) as BooleanOptionsType | null
                    }
                    onChange={(_, value) =>
                      changeHandler['drop_down']<
                        ProjectData,
                        CrossCuttingFields
                      >(value, 'is_lvc', setProjectData, sectionIdentifier)
                    }
                    getOptionLabel={(option: any) =>
                      getOptionLabel(lvcNonLvcOpts, option)
                    }
                    disabled={!canEditField(editableFields, 'is_lvc')}
                    Input={{
                      error: getIsInputDisabled('is_lvc'),
                    }}
                    {...defaultProps}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-x-20 gap-y-3">
              {canViewField(viewableFields, 'total_fund') && (
                <div>
                  <Label>{tableColumns.total_fund}</Label>
                  <SimpleInput
                    id={total_fund as string}
                    value={total_fund ?? ''}
                    onChange={(event) =>
                      handleChangeNumericValues(event, 'total_fund')
                    }
                    disabled={!canEditField(editableFields, 'total_fund')}
                    type="text"
                    {...getFieldDefaultProps('total_fund')}
                  />
                </div>
              )}
              {canViewField(viewableFields, 'support_cost_psc') && (
                <div>
                  <Label>{tableColumns.support_cost_psc}</Label>
                  <SimpleInput
                    id={support_cost_psc as string}
                    value={support_cost_psc ?? ''}
                    onChange={(event) =>
                      handleChangeNumericValues(event, 'support_cost_psc')
                    }
                    disabled={!canEditField(editableFields, 'support_cost_psc')}
                    type="text"
                    {...getFieldDefaultProps('support_cost_psc')}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-x-20 gap-y-3">
              {canViewField(viewableFields, 'project_start_date') && (
                <div>
                  <Label>{tableColumns.project_start_date}</Label>
                  <DateInput
                    id="project_start_date"
                    value={project_start_date as string}
                    onChange={(event) =>
                      changeField(
                        event.target.value || null,
                        'project_start_date',
                        setProjectData,
                        sectionIdentifier,
                      )
                    }
                    disabled={
                      !canEditField(editableFields, 'project_start_date')
                    }
                    formatValue={(value) => dayjs(value).format('MM/DD/YYYY')}
                    className={cx(defaultPropsDateInput.className, {
                      'border-red-500':
                        getIsInputDisabled('project_start_date'),
                      [disabledClassName]: !canEditField(
                        editableFields,
                        'project_start_date',
                      ),
                    })}
                  />
                </div>
              )}
              {canViewField(viewableFields, 'project_end_date') && (
                <div>
                  <Label>{tableColumns.project_end_date}</Label>
                  <DateInput
                    id="project_end_date"
                    value={project_end_date as string}
                    onChange={(event) =>
                      changeField(
                        event.target.value || null,
                        'project_end_date',
                        setProjectData,
                        sectionIdentifier,
                      )
                    }
                    disabled={!canEditField(editableFields, 'project_end_date')}
                    formatValue={(value) => dayjs(value).format('MM/DD/YYYY')}
                    className={cx(defaultPropsDateInput.className, {
                      'border-red-500': getIsInputDisabled('project_end_date'),
                      [disabledClassName]: !canEditField(
                        editableFields,
                        'project_end_date',
                      ),
                    })}
                  />
                </div>
              )}
            </div>
            {canViewField(viewableFields, 'individual_consideration') && (
              <div className="flex">
                <Label>Blanket consideration</Label>
                <Checkbox
                  className="pb-1 pl-2 pt-0"
                  checked={!individual_consideration}
                  onChange={(_, value) =>
                    handleChangeBlanketConsideration(value)
                  }
                  disabled={
                    !canEditField(editableFields, 'individual_consideration')
                  }
                  sx={{
                    color: 'black',
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default ProjectCrossCuttingFields

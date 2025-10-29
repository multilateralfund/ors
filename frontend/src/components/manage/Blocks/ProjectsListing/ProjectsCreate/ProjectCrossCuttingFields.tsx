import { ChangeEvent } from 'react'

import Field from '@ors/components/manage/Form/Field'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { STYLE } from '../../Replenishment/Inputs/constants'
import { SectionTitle } from './ProjectsCreate'
import { FieldErrorIndicator, NavigationButton } from '../HelperComponents'
import { changeField, changeHandler } from './SpecificFieldsHelpers'
import {
  canEditField,
  canGoToSecondStep,
  canViewField,
  hasFields,
} from '../utils'
import {
  tableColumns,
  lvcNonLvcOpts,
  considerationOpts,
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
  ProjectTabSetters,
  ProjectTypeApi,
} from '../interfaces'
import { ProjectTypeType } from '@ors/types/api_project_types'
import { ProjectSectorType } from '@ors/types/api_project_sector'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector.ts'
import { useStore } from '@ors/store'

import { TextareaAutosize, Divider } from '@mui/material'
import { filter, find, includes, some } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'

const ProjectCrossCuttingFields = ({
  projectData,
  setProjectData,
  project,
  errors = {},
  hasSubmitted,
  nextStep,
  setCurrentTab,
  fieldsOpts,
  specificFieldsLoaded,
  postExComUpdate,
  isV3ProjectEditable,
  mode,
}: ProjectDataProps &
  ProjectTabSetters & {
    project?: ProjectTypeApi
    nextStep: number
    specificFieldsLoaded: boolean
    postExComUpdate: boolean
    isV3ProjectEditable: boolean
    mode: string
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
  const { projIdentifiers } = projectData
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
    blanket_or_individual_consideration,
  } = crossCuttingFields

  const { projectFields, viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const isV3Project = postExComUpdate || isV3ProjectEditable
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
      className: defaultProps.FieldProps.className + ' w-[17rem]',
    },
  }
  const defaultPropsDateInput = {
    className: 'BPListUpload !ml-0 h-10 w-40 !flex-grow-0',
  }

  const areInvalidFields = !(
    canGoToSecondStep(projIdentifiers) &&
    project_type &&
    sector
  )
  const isNextDisabled = areInvalidFields || !specificFieldsLoaded

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
          <div className="flex flex-col gap-y-2">
            {canViewField(viewableFields, 'title') && (
              <div>
                <Label>{tableColumns.title}</Label>
                <div className="flex items-center">
                  <SimpleInput
                    id="title"
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
                  <FieldErrorIndicator errors={errors} field="title" />
                </div>
              </div>
            )}
            {canViewField(viewableFields, 'description') && (
              <div>
                <Label>{tableColumns.description} (max 1000 characters)</Label>
                <div className="flex items-center">
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
                    maxLength={1000}
                    style={STYLE}
                    minRows={7}
                    tabIndex={-1}
                  />
                  <FieldErrorIndicator errors={errors} field="description" />
                </div>
              </div>
            )}
          </div>
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
                  <div className="flex items-center">
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
                        (isV3Project && !!project?.project_type_id) ||
                        !specificFieldsLoaded ||
                        !canEditField(editableFields, 'project_type')
                      }
                      Input={{
                        error: getIsInputDisabled('project_type'),
                      }}
                      {...sectionDefaultProps}
                    />
                    <div className="w-5">
                      <FieldErrorIndicator
                        errors={errors}
                        field="project_type"
                      />
                    </div>
                  </div>
                </div>
              )}
              {canViewField(viewableFields, 'sector') && (
                <div>
                  <Label>{tableColumns.sector}</Label>
                  <div className="flex items-center">
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
                      getOptionLabel={(option) =>
                        getOptionLabel(sectors, option)
                      }
                      disabled={
                        (isV3Project && !!project?.sector_id) ||
                        !specificFieldsLoaded ||
                        !canEditField(editableFields, 'sector')
                      }
                      Input={{
                        error: getIsInputDisabled('sector'),
                      }}
                      {...sectionDefaultProps}
                    />
                    <FieldErrorIndicator errors={errors} field="sector" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-x-20 gap-y-3">
              {canViewField(viewableFields, 'subsectors') && (
                <div>
                  <Label>{tableColumns.subsectors}</Label>
                  <div className="flex items-center">
                    <div className="w-[40.25rem] flex-shrink">
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
                        FieldProps={{ className: 'w-full BPListUpload mb-0' }}
                      />
                    </div>
                    <FieldErrorIndicator errors={errors} field="subsector" />
                  </div>
                </div>
              )}
              {canViewField(viewableFields, 'is_lvc') && (
                <div>
                  <Label>{tableColumns.is_lvc}</Label>
                  <div className="flex items-center">
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
                    <FieldErrorIndicator errors={errors} field="is_lvc" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex w-fit grid-cols-2 flex-wrap gap-x-20 gap-y-2 md:grid">
              {canViewField(viewableFields, 'total_fund') && (
                <div>
                  <Label>{tableColumns.total_fund} (US $)</Label>
                  <div className="flex items-center">
                    <FormattedNumberInput
                      id="total_fund"
                      value={total_fund ?? ''}
                      prefix="$"
                      withoutDefaultValue={true}
                      onChange={(event) =>
                        handleChangeNumericValues(event, 'total_fund')
                      }
                      disabled={!canEditField(editableFields, 'total_fund')}
                      {...getFieldDefaultProps('total_fund')}
                    />
                    <div className="w-8">
                      <FieldErrorIndicator errors={errors} field="total_fund" />
                    </div>
                  </div>
                </div>
              )}
              {canViewField(viewableFields, 'support_cost_psc') && (
                <div>
                  <Label>{tableColumns.support_cost_psc} (US $)</Label>
                  <div className="flex items-center">
                    <FormattedNumberInput
                      id="support_cost_psc"
                      value={support_cost_psc ?? ''}
                      prefix="$"
                      withoutDefaultValue={true}
                      onChange={(event) =>
                        handleChangeNumericValues(event, 'support_cost_psc')
                      }
                      disabled={
                        !canEditField(editableFields, 'support_cost_psc')
                      }
                      {...getFieldDefaultProps('support_cost_psc')}
                    />
                    <FieldErrorIndicator
                      errors={errors}
                      field="support_cost_psc"
                    />
                  </div>
                </div>
              )}
              {canViewField(viewableFields, 'project_start_date') && (
                <div>
                  <Label>{tableColumns.project_start_date}</Label>
                  <div className="flex items-center">
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
                        (mode === 'edit' &&
                          project?.submission_status === 'Approved' &&
                          !!project?.project_start_date) ||
                        !canEditField(editableFields, 'project_start_date')
                      }
                      formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
                      className={cx(defaultPropsDateInput.className, {
                        'border-red-500':
                          getIsInputDisabled('project_start_date'),
                        [disabledClassName]:
                          (mode === 'edit' &&
                            project?.submission_status === 'Approved' &&
                            !!project_start_date) ||
                          !canEditField(editableFields, 'project_start_date'),
                      })}
                    />
                    <div className="w-8">
                      <FieldErrorIndicator
                        errors={errors}
                        field="project_start_date"
                      />
                    </div>
                  </div>
                </div>
              )}
              {canViewField(viewableFields, 'project_end_date') && (
                <div>
                  <Label>{tableColumns.project_end_date}</Label>
                  <div className="flex items-center">
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
                      disabled={
                        !canEditField(editableFields, 'project_end_date')
                      }
                      formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
                      className={cx(defaultPropsDateInput.className, {
                        'border-red-500':
                          getIsInputDisabled('project_end_date'),
                        [disabledClassName]: !canEditField(
                          editableFields,
                          'project_end_date',
                        ),
                      })}
                    />
                    <FieldErrorIndicator
                      errors={errors}
                      field="project_end_date"
                    />
                  </div>
                </div>
              )}
            </div>
            {canViewField(
              viewableFields,
              'blanket_or_individual_consideration',
            ) && (
              <div>
                <Label>
                  {tableColumns.blanket_or_individual_consideration}
                </Label>
                <div className="flex items-center">
                  <Field
                    widget="autocomplete"
                    options={considerationOpts}
                    value={
                      considerationOpts.find(
                        (opt) => opt.id === blanket_or_individual_consideration,
                      ) ?? null
                    }
                    onChange={(_, value) =>
                      changeHandler['drop_down']<
                        ProjectData,
                        CrossCuttingFields
                      >(
                        value,
                        'blanket_or_individual_consideration',
                        setProjectData,
                        sectionIdentifier,
                      )
                    }
                    getOptionLabel={(option: any) =>
                      getOptionLabel(considerationOpts, option, 'value')
                    }
                    disabled={
                      isV3Project ||
                      !canEditField(
                        editableFields,
                        'blanket_or_individual_consideration',
                      )
                    }
                    Input={{
                      error: getIsInputDisabled(
                        'blanket_or_individual_consideration',
                      ),
                    }}
                    {...{
                      ...defaultProps,
                      FieldProps: {
                        className:
                          defaultProps.FieldProps.className + ' w-[13.5rem]',
                      },
                    }}
                  />
                  <FieldErrorIndicator
                    errors={errors}
                    field="blanket_or_individual_consideration"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" {...{ setCurrentTab }} />
        <NavigationButton
          nextTab={nextStep - 1}
          isBtnDisabled={isNextDisabled}
          setCurrentTab={setCurrentTab}
        />
      </div>
    </>
  )
}

export default ProjectCrossCuttingFields

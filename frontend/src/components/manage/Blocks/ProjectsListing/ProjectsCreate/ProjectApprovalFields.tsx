import React, { useMemo } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import Field from '@ors/components/manage/Form/Field.tsx'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers.tsx'
import { getMeetingNr } from '@ors/components/manage/Utils/utilFunctions'
import { FieldErrorIndicator, NavigationButton } from '../HelperComponents'
import ProjectFundFields from './ProjectFundFields'
import { widgets } from './SpecificFieldsHelpers'
import { STYLE } from '../../Replenishment/Inputs/constants'
import { canEditField, canViewField, getTransferFieldLabel } from '../utils'
import {
  ProjectData,
  ProjectSpecificFields,
  ProjectTabSetters,
  ProjectTypeApi,
  SpecificFieldsSectionProps,
} from '../interfaces'
import {
  disabledClassName,
  tableColumns,
  defaultProps,
  textAreaClassname,
  approvalOdsFields,
} from '../constants'
import useApi from '@ors/hooks/useApi.ts'
import { useStore } from '@ors/store'
import { ApiDecision } from '@ors/types/api_meetings.ts'

import { TextareaAutosize } from '@mui/material'
import { find, lowerCase, map } from 'lodash'
import cx from 'classnames'

type DecisionOption = {
  name: string
  value: number
}

const ProjectApprovalFields = ({
  projectData,
  setProjectData,
  project,
  errors = {},
  sectionFields,
  setCurrentTab,
}: SpecificFieldsSectionProps &
  ProjectTabSetters & { project?: ProjectTypeApi }) => {
  const sectionIdentifier = 'approvalFields'
  const crtSectionData = projectData[sectionIdentifier]

  const { viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data
  const meetingNumber = find(
    meetings,
    (option) => option.id === project?.meeting_id,
  )?.number

  const decisionsApi = useApi<ApiDecision[]>({
    path: 'api/decisions',
    options: {
      triggerIf: !!project?.meeting_id,
      params: {
        meeting_id: project?.meeting_id,
      },
    },
  })

  const decisionOptions = useMemo(() => {
    const data = decisionsApi.data ?? ([] as ApiDecision[])
    return map(data, (d) => ({ name: d.number, value: d.id }))
  }, [decisionsApi.data])

  const handleChangeDecision = (option: DecisionOption | string | null) => {
    const initialValue =
      typeof option === 'string' ? option : (option?.value.toString() ?? '')

    if (initialValue === '' || !isNaN(parseInt(initialValue))) {
      const finalVal = initialValue ? parseInt(initialValue) : null

      setProjectData(
        (prevData) => ({
          ...prevData,
          [sectionIdentifier]: {
            ...prevData[sectionIdentifier],
            decision: finalVal,
          },
        }),
        'decision',
      )
    }
  }

  const approvalField = (field: ProjectSpecificFields, data_type?: string) =>
    canViewField(viewableFields, field.write_field_name) && (
      <React.Fragment key={field.write_field_name}>
        {widgets[
          (data_type ?? field.data_type) as keyof typeof widgets
        ]<ProjectData>(
          projectData,
          setProjectData,
          field,
          errors,
          editableFields,
          sectionIdentifier,
        )}
      </React.Fragment>
    )

  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {canViewField(viewableFields, 'meeting') && (
          <div className="w-40">
            <Label>
              {getTransferFieldLabel(project as ProjectTypeApi, 'meeting')}
            </Label>
            <PopoverInput
              label={meetingNumber?.toString()}
              options={[]}
              disabled={true}
              className={cx('!m-0 h-10 !py-1', disabledClassName)}
            />
          </div>
        )}
        {project?.status === 'Transferred' && (
          <div className="w-40">
            <Label>{tableColumns.transfer_meeting}</Label>
            <PopoverInput
              label={getMeetingNr(
                project?.transfer_meeting_id ?? undefined,
              )?.toString()}
              options={[]}
              disabled={true}
              className={cx('!m-0 h-10 !py-1', disabledClassName)}
            />
          </div>
        )}
        {canViewField(viewableFields, 'decision') && (
          <div>
            <Label>
              {getTransferFieldLabel(project as ProjectTypeApi, 'decision')}
            </Label>
            <div className="flex items-center">
              <div className="w-[16rem]">
                <Field<any>
                  widget="autocomplete"
                  options={decisionOptions}
                  disabled={!canEditField(editableFields, 'decision')}
                  value={crtSectionData.decision ?? null}
                  onChange={(_, value) =>
                    handleChangeDecision(value as DecisionOption)
                  }
                  getOptionLabel={(option) => {
                    return getOptionLabel(decisionOptions, option, 'value')
                  }}
                  {...{
                    ...defaultProps,
                    FieldProps: {
                      className:
                        defaultProps.FieldProps.className + ' w-[16rem]',
                    },
                  }}
                />
              </div>
              <FieldErrorIndicator errors={errors} field="Decision" />
            </div>
          </div>
        )}
        {sectionFields
          .filter(
            (field) =>
              ![
                ...approvalOdsFields,
                'meeting',
                'decision',
                'date_approved',
              ].includes(field.write_field_name),
          )
          .map((field) => {
            const dataType = ['programme_officer', 'funding_window'].includes(
              field.write_field_name,
            )
              ? 'simpleText'
              : field.data_type

            return (
              <>
                {approvalField(field, dataType)}
                {field.write_field_name === 'excom_provision' &&
                  project?.status === 'Transferred' && (
                    <div className="w-full">
                      <Label>
                        {tableColumns.transfer_excom_provision} (max 500
                        characters)
                      </Label>
                      <TextareaAutosize
                        value={project?.transfer_excom_provision}
                        disabled={true}
                        className={cx(textAreaClassname, 'max-w-[415px]')}
                        maxLength={500}
                        style={STYLE}
                        minRows={2}
                      />
                    </div>
                  )}
              </>
            )
          })}
      </div>
      <div className="mt-2 flex w-fit grid-cols-2 flex-wrap gap-x-12 gap-y-2 md:grid">
        {sectionFields
          .filter((field) => approvalOdsFields.includes(field.write_field_name))
          .map((field) => approvalField(field))}
      </div>
      <div className="mt-2 flex w-fit grid-cols-2 flex-wrap gap-x-12 gap-y-2 md:grid">
        <ProjectFundFields
          {...{ projectData, setProjectData, project, errors }}
          mode="edit"
          type="approval"
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton {...{ setCurrentTab }} />
      </div>
    </>
  )
}

export default ProjectApprovalFields

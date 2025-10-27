import React, { useMemo } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import Field from '@ors/components/manage/Form/Field.tsx'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers.tsx'
import { NavigationButton } from '../HelperComponents'
import { widgets } from './SpecificFieldsHelpers'
import { canEditField, canViewField } from '../utils'
import {
  ProjectData,
  ProjectTabSetters,
  ProjectTypeApi,
  SpecificFieldsSectionProps,
} from '../interfaces'
import {
  defaultPropsSimpleField,
  disabledClassName,
  tableColumns,
  defaultProps,
} from '../constants'
import useApi from '@ors/hooks/useApi.ts'
import { useStore } from '@ors/store'
import { ApiDecision } from '@ors/types/api_meetings.ts'

import { find, map } from 'lodash'
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
  hasSubmitted,
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
    (option) => option.id === project?.meeting,
  )?.number

  const decisionsApi = useApi<ApiDecision[]>({
    path: 'api/decisions',
    options: {
      triggerIf: !!project?.meeting,
      params: {
        meeting_id: project?.meeting,
      },
    },
  })

  const decisionOptions = useMemo(() => {
    const data = decisionsApi.data ?? ([] as ApiDecision[])
    return map(data, (d) => ({ name: d.number, value: d.id }))
  }, [decisionsApi.data])

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

  const handleChangeDecision = (option: DecisionOption | string | null) => {
    const initialValue =
      typeof option === 'string' ? option : (option?.value.toString() ?? '')

    if (initialValue === '' || !isNaN(parseInt(initialValue))) {
      const finalVal = initialValue ? parseInt(initialValue) : null

      setProjectData((prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          decision: finalVal,
        },
      }))
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {canViewField(viewableFields, 'meeting') && (
          <div className="w-32">
            <Label>{tableColumns.meeting}</Label>
            <PopoverInput
              label={meetingNumber?.toString()}
              options={[]}
              disabled={true}
              className={cx('!m-0 h-10 !py-1', disabledClassName, {
                'border-red-500': getIsInputDisabled('meeting'),
              })}
            />
          </div>
        )}
        {canViewField(viewableFields, 'decision') && (
          <div className="w-[16rem]">
            <Label>{tableColumns.decision}</Label>
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
                  className: defaultProps.FieldProps.className + ' w-[16rem]',
                },
              }}
            />
          </div>
        )}
        {sectionFields
          .filter(
            (field) =>
              !['meeting', 'decision', 'date_approved'].includes(
                field.write_field_name,
              ),
          )
          .map((field) => {
            const dataType = ['programme_officer', 'funding_window'].includes(
              field.write_field_name,
            )
              ? 'simpleText'
              : field.data_type

            return (
              canViewField(viewableFields, field.write_field_name) && (
                <React.Fragment key={field.write_field_name}>
                  {widgets[dataType]<ProjectData>(
                    projectData,
                    setProjectData,
                    field,
                    errors,
                    false,
                    hasSubmitted,
                    editableFields,
                    sectionIdentifier,
                  )}
                </React.Fragment>
              )
            )
          })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton {...{ setCurrentTab }} />
      </div>
    </>
  )
}

export default ProjectApprovalFields

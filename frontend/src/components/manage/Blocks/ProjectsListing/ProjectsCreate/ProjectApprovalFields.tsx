import React, { useMemo } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import Field from '@ors/components/manage/Form/Field.tsx'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers.tsx'
import { getMeetingNr } from '@ors/components/manage/Utils/utilFunctions'
import { FieldErrorIndicator, NavigationButton } from '../HelperComponents'
import { widgets } from './SpecificFieldsHelpers'
import { FormattedNumberInput } from '../../Replenishment/Inputs'
import { STYLE } from '../../Replenishment/Inputs/constants'
import { canEditField, canViewField, handleChangeNumericValues } from '../utils'
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
  textAreaClassname,
} from '../constants'
import useApi from '@ors/hooks/useApi.ts'
import { useStore } from '@ors/store'
import { ApiDecision } from '@ors/types/api_meetings.ts'

import { TextareaAutosize } from '@mui/material'
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
  sectionFields,
  setCurrentTab,
}: SpecificFieldsSectionProps &
  ProjectTabSetters & { project?: ProjectTypeApi }) => {
  const sectionIdentifier = 'approvalFields'
  const crtSectionData = projectData[sectionIdentifier]
  const crossCuttingSectionIdentifier = 'crossCuttingFields'
  const crossCuttingSectionData = projectData[crossCuttingSectionIdentifier]
  const { total_fund, support_cost_psc } = crossCuttingSectionData

  const isRecommended = project?.submission_status === 'Recommended'

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

  const getFieldDefaultProps = (field: string) => {
    return {
      ...{
        ...defaultPropsSimpleField,
        className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1', {
          [disabledClassName]:
            !canEditField(editableFields, field) ||
            (['total_fund', 'support_cost_psc'].includes(field) &&
              !isRecommended),
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
          <div className="w-40">
            <Label>{tableColumns.meeting}</Label>
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
            <Label>{tableColumns.decision}</Label>
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
              <>
                {canViewField(viewableFields, field.write_field_name) && (
                  <React.Fragment key={field.write_field_name}>
                    {widgets[dataType]<ProjectData>(
                      projectData,
                      setProjectData,
                      field,
                      errors,
                      editableFields,
                      sectionIdentifier,
                    )}
                  </React.Fragment>
                )}
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
                        tabIndex={-1}
                      />
                    </div>
                  )}
              </>
            )
          })}
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
                  handleChangeNumericValues(
                    event,
                    'total_fund',
                    crossCuttingSectionIdentifier,
                    setProjectData,
                  )
                }
                disabled={
                  !canEditField(editableFields, 'total_fund') || !isRecommended
                }
                {...getFieldDefaultProps('total_fund')}
              />
              <FieldErrorIndicator errors={errors} field="total_fund" />
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
                  handleChangeNumericValues(
                    event,
                    'support_cost_psc',
                    crossCuttingSectionIdentifier,
                    setProjectData,
                  )
                }
                disabled={
                  !canEditField(editableFields, 'support_cost_psc') ||
                  !isRecommended
                }
                {...getFieldDefaultProps('support_cost_psc')}
              />
              <FieldErrorIndicator errors={errors} field="support_cost_psc" />
            </div>
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton {...{ setCurrentTab }} />
      </div>
    </>
  )
}

export default ProjectApprovalFields

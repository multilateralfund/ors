import React, { ChangeEvent, useMemo } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  getMeetingNr,
  getMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import { NavigationButton } from '../HelperComponents'
import { widgets } from './SpecificFieldsHelpers'
import { canEditField, canViewField } from '../utils'
import {
  ProjectData,
  ProjectTabSetters,
  SpecificFieldsSectionProps,
} from '../interfaces'
import {
  defaultPropsSimpleField,
  disabledClassName,
  tableColumns,
  defaultProps,
} from '../constants'
import { useStore } from '@ors/store'
import { parseNumber } from '@ors/helpers'

import cx from 'classnames'
import useApi from '@ors/hooks/useApi.ts'
import { ApiDecision } from '@ors/types/api_meetings.ts'
import { map } from 'lodash'
import Field from '@ors/components/manage/Form/Field.tsx'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers.tsx'

type DecisionOption = {
  name: string
  value: number
}

const ProjectApprovalFields = ({
  projectData,
  setProjectData,
  errors = {},
  hasSubmitted,
  sectionFields,
  setCurrentTab,
}: SpecificFieldsSectionProps & ProjectTabSetters) => {
  const sectionIdentifier = 'approvalFields'
  const crtSectionData = projectData[sectionIdentifier]

  const { viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )
  const canEditMeeting = canEditField(editableFields, 'meeting_approved')

  const decisionsApi = useApi<ApiDecision[]>({
    path: 'api/decisions',
    options: {
      triggerIf: !!crtSectionData?.meeting_approved,
      params: {
        meeting_id: crtSectionData?.meeting_approved,
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

  const handleChangeMeeting = (meeting?: string) => {
    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        meeting_approved: parseNumber(meeting),
        ...(parseNumber(meeting) !== crtSectionData?.meeting_approved
          ? { decision: null }
          : {}),
      },
    }))
    decisionsApi.setParams({ meeting_id: meeting })
    decisionsApi.setApiSettings((prev) => ({
      ...prev,
      options: { ...prev.options, triggerIf: !!meeting },
    }))
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
        {canViewField(viewableFields, 'meeting_approved') && (
          <div className="w-32">
            <Label>{tableColumns.meeting}</Label>
            <PopoverInput
              label={getMeetingNr(
                crtSectionData?.meeting_approved ?? undefined,
              )?.toString()}
              options={getMeetingOptions()}
              onChange={handleChangeMeeting}
              onClear={() => handleChangeMeeting()}
              disabled={!canEditMeeting}
              className={cx('!m-0 h-10 !py-1', {
                'border-red-500': getIsInputDisabled('meeting_approved'),
                [disabledClassName]: !canEditMeeting,
              })}
              clearBtnClassName="right-1"
              withClear={canEditMeeting}
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
              !['meeting_approved', 'decision', 'date_approved'].includes(
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

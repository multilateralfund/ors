import React, { ChangeEvent } from 'react'

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
} from '../constants'
import { useStore } from '@ors/store'
import { parseNumber } from '@ors/helpers'

import cx from 'classnames'

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
      },
    }))
  }

  const handleChangeDecision = (event: ChangeEvent<HTMLInputElement>) => {
    const initialValue = event.target.value

    if (initialValue === '' || !isNaN(parseInt(initialValue))) {
      const finalVal = initialValue ? parseInt(initialValue).toString() : null

      setProjectData((prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          decision: finalVal,
        },
      }))
    } else {
      event.preventDefault()
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-5">
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
          <div>
            <Label>{tableColumns.decision}</Label>
            <SimpleInput
              id="Decision"
              value={crtSectionData.decision ?? ''}
              onChange={handleChangeDecision}
              disabled={!canEditField(editableFields, 'decision')}
              type="text"
              {...getFieldDefaultProps('decision')}
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

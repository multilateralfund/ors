import { useContext } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  getMeetingNr,
  useMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import {
  EnterpriseDateField,
  EnterpriseNumberField,
  EnterpriseSelectField,
  EnterpriseTextAreaField,
} from '../FormHelperComponents'
import { detailsDateFields, enterpriseFieldsMapping } from '../constants'
import { disabledClassName } from '../../constants'
import {
  PEnterpriseDataProps,
  PEnterpriseData,
  EnterpriseDetails,
  ProjectTypeApi,
} from '../../interfaces'
import { parseNumber } from '@ors/helpers'

import { map } from 'lodash'
import cx from 'classnames'

const PEnterpriseDetailsSection = ({
  enterpriseData,
  setEnterpriseData,
  projectData,
  hasSubmitted,
  errors,
}: PEnterpriseDataProps & { projectData: ProjectTypeApi }) => {
  const { canEditProjectEnterprise } = useContext(PermissionsContext)
  const isDisabled = !canEditProjectEnterprise

  const { agencies, project_types } = useContext(ProjectsDataContext)
  const { agency_id, project_type_id, project_end_date, meeting_id } =
    projectData

  const sectionIdentifier = 'details'
  const { details } = enterpriseData

  const isMeetingDisabled = isDisabled || !!meeting_id

  const selectFields = [
    {
      fieldName: 'agency',
      options: agencies,
      isDisabled: isDisabled || !!agency_id,
    },
    {
      fieldName: 'project_type',
      options: project_types,
      isDisabled: isDisabled || !!project_type_id,
    },
  ]

  const handleChangeMeeting = (meeting?: string) => {
    setEnterpriseData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        meeting: parseNumber(meeting),
      },
    }))
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-wrap gap-x-20 gap-y-4">
        {map(selectFields, (field) => (
          <EnterpriseSelectField<PEnterpriseData, EnterpriseDetails>
            enterpriseData={details}
            isDisabled={field.isDisabled}
            {...{
              setEnterpriseData,
              sectionIdentifier,
              field,
              hasSubmitted,
              errors,
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-[5.5rem] gap-y-4">
        {map(detailsDateFields.slice(0, 2), (field) => (
          <EnterpriseDateField<PEnterpriseData, EnterpriseDetails>
            enterpriseData={details}
            isDisabled={
              field === 'planned_completion_date'
                ? isDisabled || !!project_end_date
                : isDisabled
            }
            {...{
              setEnterpriseData,
              sectionIdentifier,
              field,
              hasSubmitted,
              errors,
            }}
          />
        ))}
        <EnterpriseNumberField<PEnterpriseData, EnterpriseDetails>
          dataType="integer"
          field="project_duration"
          enterpriseData={details}
          {...{
            setEnterpriseData,
            sectionIdentifier,
            isDisabled,
            hasSubmitted,
            errors,
          }}
        />
      </div>
      <div className="flex flex-wrap gap-x-[5.5rem] gap-y-4">
        <div className="w-40">
          <Label>{enterpriseFieldsMapping.meeting}</Label>
          <PopoverInput
            label={getMeetingNr(details?.meeting ?? undefined)?.toString()}
            options={useMeetingOptions()}
            onChange={handleChangeMeeting}
            onClear={() => handleChangeMeeting()}
            disabled={isMeetingDisabled}
            clearBtnClassName="right-1"
            className={cx('!m-0 h-10 !py-1', {
              [disabledClassName]: isMeetingDisabled,
            })}
            withClear={!isMeetingDisabled}
          />
        </div>
        {map(detailsDateFields.slice(2), (field) => (
          <EnterpriseDateField<PEnterpriseData, EnterpriseDetails>
            enterpriseData={details}
            isDisabled={field === 'date_of_approval' ? true : isDisabled}
            {...{
              setEnterpriseData,
              sectionIdentifier,
              field,
              hasSubmitted,
              errors,
            }}
          />
        ))}
      </div>
      <div className="max-w-[41rem]">
        <EnterpriseTextAreaField<PEnterpriseData, EnterpriseDetails>
          enterpriseData={details}
          field="excom_provision"
          {...{
            setEnterpriseData,
            sectionIdentifier,
            isDisabled,
            hasSubmitted,
            errors,
          }}
        />
      </div>
    </div>
  )
}

export default PEnterpriseDetailsSection

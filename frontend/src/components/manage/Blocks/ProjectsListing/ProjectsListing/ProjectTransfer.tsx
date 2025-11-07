import { Dispatch, SetStateAction, useContext, useMemo } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import {
  getMeetingNr,
  useMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { DecisionOption } from '../ProjectsCreate/ProjectIdentifiersFields'
import { FieldErrorIndicator } from '../HelperComponents'
import { defaultProps, tableColumns } from '../constants'
import { ProjectTransferData } from '../interfaces'
import { ApiDecision } from '@ors/types/api_meetings'
import { ApiAgency } from '@ors/types/api_agencies'
import { parseNumber } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

import { map } from 'lodash'
import cx from 'classnames'

const ProjectTransfer = ({
  projectData,
  setProjectData,
  files,
  setFiles,
  errors,
  fileErrors,
  hasSubmitted,
}: {
  projectData: ProjectTransferData
  setProjectData: Dispatch<SetStateAction<ProjectTransferData>>
  files: any
  setFiles: any
  errors: any
  fileErrors: any
  hasSubmitted: boolean
}) => {
  const { agencies } = useContext(ProjectsDataContext)

  const decisionsApi = useApi<ApiDecision[]>({
    path: 'api/decisions',
    options: {
      triggerIf: !!projectData.transfer_meeting,
      params: {
        meeting_id: projectData.transfer_meeting,
      },
    },
  })

  const decisionOptions = useMemo(() => {
    const data = decisionsApi.data ?? ([] as ApiDecision[])
    return map(data, (d) => ({ name: d.number, value: d.id }))
  }, [decisionsApi.data])

  const sectionDefaultProps = {
    ...defaultProps,
    FieldProps: {
      className: defaultProps.FieldProps.className + ' w-[16rem]',
    },
  }

  // const dataErrors = useMemo(
  //   () => getProjIdentifiersErrors(projIdentifiers, errors),
  //   [projIdentifiers, errors],
  // )
  const hasNoFiles = files.length === 0

  const handleChangeAgency = (value: ApiAgency | null) => {
    setProjectData((prevData) => ({
      ...prevData,
      agency: value?.id ?? null,
    }))
  }

  const handleChangeMeeting = (meeting?: string) => {
    setProjectData((prevData) => ({
      ...prevData,
      transfer_meeting: parseNumber(meeting),
      ...(parseNumber(meeting) !== projectData.transfer_meeting
        ? { transfer_decision: null }
        : {}),
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
        transfer_decision: finalVal,
      }))
    }
  }

  const getHasErrors = (field: keyof typeof errors) =>
    hasSubmitted && errors[field]?.length > 0

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          <div>
            <Label>Agency</Label>
            <div className="flex items-center">
              <Field
                widget="autocomplete"
                options={agencies}
                value={projectData.agency}
                onChange={(_, value) => {
                  handleChangeAgency(value)
                }}
                getOptionLabel={(option) => getOptionLabel(agencies, option)}
                Input={{ error: getHasErrors('agency') }}
                {...sectionDefaultProps}
              />
              <FieldErrorIndicator errors={errors} field="agency" />
            </div>
          </div>
          <div>
            <Label>{tableColumns.meeting}</Label>
            <div className="flex items-center">
              <div className="w-32">
                <PopoverInput
                  label={getMeetingNr(
                    projectData.transfer_meeting ?? undefined,
                  )?.toString()}
                  options={useMeetingOptions()}
                  onChange={handleChangeMeeting}
                  onClear={() => handleChangeMeeting()}
                  className={cx('!m-0 h-10 !py-1', {
                    'border-red-500': getHasErrors('transfer_meeting'),
                  })}
                  clearBtnClassName="right-1"
                />
              </div>
              <div className="w-8">
                <FieldErrorIndicator errors={errors} field="transfer_meeting" />
              </div>
            </div>
          </div>
          <div className="w-[16rem]">
            <Label htmlFor="decision">Decision</Label>
            <div className="flex items-center">
              <Field
                widget="autocomplete"
                options={decisionOptions}
                value={projectData.transfer_decision ?? null}
                onChange={(_, value) =>
                  handleChangeDecision(value as DecisionOption)
                }
                getOptionLabel={(option) =>
                  getOptionLabel(decisionOptions, option, 'value')
                }
                Input={{ error: getHasErrors('transfer_decision') }}
                {...sectionDefaultProps}
              />
              <FieldErrorIndicator errors={errors} field="transfer_decision" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectTransfer

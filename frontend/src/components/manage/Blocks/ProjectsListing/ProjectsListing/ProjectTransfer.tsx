import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useContext,
  useMemo,
} from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import {
  getMeetingNr,
  useMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { DecisionOption } from '../ProjectsCreate/ProjectIdentifiersFields'
import ProjectDocumentation from '../ProjectView/ProjectDocumentation'
import { FormattedNumberInput } from '../../Replenishment/Inputs'
import { STYLE } from '../../Replenishment/Inputs/constants'
import { FieldErrorIndicator } from '../HelperComponents'
import { BpFilesObject } from '../../BusinessPlans/types'
import { onTextareaFocus } from '../utils'
import {
  FileMetaDataProps,
  ProjectTransferData,
  ProjectTypeApi,
} from '../interfaces'
import {
  defaultProps,
  defaultPropsSimpleField,
  tableColumns,
  textAreaClassname,
} from '../constants'
import { ApiDecision } from '@ors/types/api_meetings'
import { ApiAgency } from '@ors/types/api_agencies'
import { parseNumber } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'

import { Divider, TextareaAutosize } from '@mui/material'
import { BsFilesAlt } from 'react-icons/bs'
import { filter, map } from 'lodash'
import cx from 'classnames'

const ProjectTransfer = ({
  projectData,
  setProjectData,
  project,
  errors,
  missingFileTypeErrors,
  ...rest
}: FileMetaDataProps & {
  projectData: ProjectTransferData
  setProjectData: Dispatch<SetStateAction<ProjectTransferData>>
  project: ProjectTypeApi
  files: BpFilesObject
  setFiles: React.Dispatch<React.SetStateAction<BpFilesObject>>
  errors: { [key: string]: string[] }
  missingFileTypeErrors: Array<{ id: number; message: string } | null>
  allFileErrors: { message: string }[]
}) => {
  const { agencies } = useContext(ProjectsDataContext)
  const agenciesOpts = filter(
    agencies,
    (agency) => agency.id !== project.agency_id,
  )

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

  const fieldDefaultProps = (field: string) => ({
    ...defaultProps,
    FieldProps: {
      className:
        defaultProps.FieldProps.className +
        (field === 'agency' ? ' max-w-40 w-40' : ' w-[16rem]'),
    },
  })

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

  const handleChangeExcomProvision = (excom_provision: string) =>
    setProjectData((prev) => ({
      ...prev,
      transfer_excom_provision: excom_provision,
    }))

  const handleChangeNumericValues = (
    event: ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const initialValue = event.target.value
    const value = initialValue === '' ? null : initialValue

    if (!isNaN(Number(value))) {
      setProjectData((prevData) => ({ ...prevData, [field]: value }))
    } else {
      event.preventDefault()
    }
  }

  const numberFieldDefaultProps = {
    ...{
      ...defaultPropsSimpleField,
      className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1'),
    },
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <HeaderWithIcon title="Main attributes" Icon={BsFilesAlt} />
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          <div>
            <Label>Agency</Label>
            <div className="flex items-center">
              <Field
                widget="autocomplete"
                options={agenciesOpts}
                value={projectData.agency}
                onChange={(_, value) => {
                  handleChangeAgency(value)
                }}
                getOptionLabel={(option) =>
                  getOptionLabel(agenciesOpts, option)
                }
                {...fieldDefaultProps('agency')}
              />
              <div className="w-8">
                <FieldErrorIndicator errors={errors} field="agency" />
              </div>
            </div>
          </div>
          <div>
            <Label>{tableColumns.transfer_meeting}</Label>
            <div className="flex items-center">
              <div className="w-40">
                <PopoverInput
                  label={getMeetingNr(
                    projectData.transfer_meeting ?? undefined,
                  )?.toString()}
                  options={useMeetingOptions()}
                  onChange={handleChangeMeeting}
                  onClear={handleChangeMeeting}
                  className="!m-0 h-10 !py-1"
                  withClear={true}
                  clearBtnClassName="right-1"
                />
              </div>
              <div className="w-8">
                <FieldErrorIndicator errors={errors} field="transfer_meeting" />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="decision">{tableColumns.transfer_decision}</Label>
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
                {...fieldDefaultProps('decision')}
              />
              <FieldErrorIndicator errors={errors} field="transfer_decision" />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full">
        <Label>
          {tableColumns.transfer_excom_provision} (max 500 characters)
        </Label>
        <div className="flex items-center">
          <TextareaAutosize
            value={projectData.transfer_excom_provision}
            onFocus={onTextareaFocus}
            onChange={(e) => handleChangeExcomProvision(e.target.value)}
            className={cx(textAreaClassname, 'max-w-[435px]')}
            maxLength={500}
            style={STYLE}
            minRows={2}
          />
          <FieldErrorIndicator
            errors={errors}
            field="transfer_excom_provision"
          />
        </div>
      </div>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-wrap gap-y-3">
          <div className="mr-[4rem]">
            <Label>{tableColumns.fund_transferred}</Label>
            <div className="flex items-center">
              <FormattedNumberInput
                id="fund_transferred"
                value={projectData.fund_transferred ?? ''}
                prefix="$"
                withoutDefaultValue={true}
                onChange={(event) =>
                  handleChangeNumericValues(event, 'fund_transferred')
                }
                {...numberFieldDefaultProps}
              />
              <div className="w-8">
                <FieldErrorIndicator errors={errors} field="fund_transferred" />
              </div>
            </div>
          </div>
          <div className="mr-[1.7rem]">
            <Label>{tableColumns.psc_transferred}</Label>
            <div className="flex items-center">
              <FormattedNumberInput
                id="psc_transferred"
                value={projectData.psc_transferred ?? ''}
                prefix="$"
                withoutDefaultValue={true}
                onChange={(event) =>
                  handleChangeNumericValues(event, 'psc_transferred')
                }
                {...numberFieldDefaultProps}
              />
              <FieldErrorIndicator errors={errors} field="psc_transferred" />
            </div>
          </div>
        </div>
      </div>
      <Divider className="my-1" />
      <ProjectDocumentation
        mode="transfer"
        errors={missingFileTypeErrors}
        {...{ project }}
        {...rest}
      />
    </div>
  )
}

export default ProjectTransfer

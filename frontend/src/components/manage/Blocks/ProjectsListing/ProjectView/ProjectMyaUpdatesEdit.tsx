import { useCallback, useEffect, useState } from 'react'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { orderFieldData } from '../UpdateMyaData/MetaProjectEdit'
import PListingTable from '../ProjectsListing/PListingTable'
import { monetaryFields } from '../UpdateMyaData/constants'
import { disabledClassName } from '../constants'
import {
  formatFieldLabel,
  getFormattedDecimalValue,
  getProjectDuration,
} from '../utils'
import {
  MetaProjectDetailType,
  MetaProjectFieldData,
} from '../UpdateMyaData/types'
import { getResults } from '@ors/helpers'
import { ProjectType } from '@ors/types/api_projects'

import { CircularProgress, Typography } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'

const projectDuration = 'project_duration'

const ProjectMyaUpdatesEdit = ({
  metaprojectData,
}: {
  metaprojectData?: MetaProjectDetailType | null
}) => {
  const projects = getResults<ProjectType>(metaprojectData?.projects ?? [])

  const formatMetaprojectData = useCallback(() => {
    const result = {} as Record<string, any>
    const fd = metaprojectData?.field_data ?? ({} as MetaProjectFieldData)

    for (const key of Object.keys(fd)) {
      const fdEntry = fd[key as keyof MetaProjectFieldData]
      result[key] =
        fdEntry.type === 'DecimalField'
          ? getFormattedDecimalValue(fdEntry.value as string)
          : fdEntry.value
    }

    return result
  }, [metaprojectData])

  const [mpData, setMpData] = useState(formatMetaprojectData)

  useEffect(() => {
    setMpData(formatMetaprojectData)
  }, [formatMetaprojectData, metaprojectData])

  const fieldData = orderFieldData(metaprojectData?.field_data ?? {})

  const computeProjectDuration = () =>
    getProjectDuration({
      project_start_date: getBaseFieldValue('start_date'),
      project_end_date: getBaseFieldValue('end_date'),
    })

  const getBaseFieldValue = (name: string) => {
    const formValue = mpData[name]
    const computedValue = metaprojectData?.computed_field_data?.[name]

    return formValue === null ? computedValue : formValue
  }

  const getFieldValue = (name: string, missing?: string) =>
    name === projectDuration
      ? computeProjectDuration()
      : getBaseFieldValue(name) || (missing ?? '')

  const valueIsComputed = (name: string) => {
    const formValue = mpData[name]
    const computedValue = metaprojectData?.computed_field_data?.[name]

    return (
      name === projectDuration ||
      (formValue === null && computedValue !== undefined)
    )
  }

  const fieldComponent = (fd: any) => {
    const fieldValue = getFieldValue(fd.name)

    switch (fd.type) {
      case 'DateTimeField':
        return (
          <DateInput
            id={fd.name}
            className={cx('BPListUpload !ml-0 h-10 w-40', disabledClassName)}
            value={fieldValue.toString()}
            formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
            disabled={true}
          />
        )
      case 'DecimalField':
        return (
          <FormattedNumberInput
            id={fd.name}
            className={cx(
              '!m-0 h-10 w-full !border-gray-400 p-2.5',
              disabledClassName,
            )}
            withoutDefaultValue={true}
            prefix={monetaryFields.includes(fd.name) ? '$' : ''}
            value={fieldValue}
            disabled={true}
          />
        )
      default:
        return (
          <FormattedNumberInput
            id={fd.name}
            className={cx(
              '!m-0 h-10 w-full !border-gray-400 p-2.5',
              disabledClassName,
            )}
            withoutDefaultValue={true}
            value={fieldValue}
            decimalDigits={0}
            disabled={true}
          />
        )
    }
  }

  const renderFieldData = (fieldData: any) => {
    return fieldData.map((fd: any) => {
      const isComputed = valueIsComputed(fd.name)

      return (
        <div key={fd.name} className="py-2">
          <Label htmlFor={fd.name}>
            <span className="mt-2 flex justify-between">
              {formatFieldLabel(fd.label)}
              {isComputed ? (
                <span
                  className="border-1 rounded-lg border border-solid border-[#2E708E] px-1 text-[#2E708E]"
                  title="Based on contained projects."
                >
                  Computed
                </span>
              ) : null}
            </span>
          </Label>
          {fieldComponent(fd)}
        </div>
      )
    })
  }

  return (
    <div>
      {!!metaprojectData?.id ? (
        <div className="flex flex-col gap-y-3">
          <Typography variant="h6">
            MYA: {metaprojectData?.umbrella_code}, Lead agency:{' '}
            {metaprojectData?.lead_agency?.name || '-'}
          </Typography>
          <Typography variant="h6">Projects under this MYA</Typography>
          <PListingTable
            mode="listing"
            projects={projects as any}
            filters={{}}
            enablePagination={false}
          />
          <div>
            <Typography variant="h6">Details</Typography>
            <div className="flex gap-x-8">
              <div className="flex-grow">
                {renderFieldData(
                  fieldData.slice(0, Math.ceil(fieldData.length / 2)),
                )}
              </div>
              <div className="flex-grow">
                {renderFieldData(
                  fieldData.slice(Math.ceil(fieldData.length / 2)),
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CircularProgress color="inherit" size="24px" className="ml-1.5" />
      )}
    </div>
  )
}

export default ProjectMyaUpdatesEdit

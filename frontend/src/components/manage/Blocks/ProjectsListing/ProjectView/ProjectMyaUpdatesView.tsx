import { useCallback, useEffect, useState } from 'react'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { orderFieldData } from '../UpdateMyaData/MetaProjectEdit'
import {
  computedTag,
  getFilteredFields,
  groupFieldsLabel,
  groupFieldsMeasurementUnits,
} from '../HelperComponents'
import { monetaryFields } from '../UpdateMyaData/constants'
import { disabledClassName } from '../constants'
import {
  formatFieldLabel,
  getFormattedDecimalValue,
  getFormattedNumericValue,
  getProjectDuration,
} from '../utils'
import {
  MetaProjectDetailType,
  MetaProjectFieldData,
} from '../UpdateMyaData/types'

import { CircularProgress, Typography } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'

const projectDuration = 'project_duration'

const ProjectMyaUpdatesView = ({
  metaprojectData,
  mode,
}: {
  metaprojectData: MetaProjectDetailType | null
  mode: string
}) => {
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
  const {
    dateFields,
    baselineFields,
    targetFields,
    phaseOutFields,
    startingPointFields,
    costEffectivenessFields,
  } = getFilteredFields(fieldData)

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

  const getFieldValue = (name: string) =>
    name === projectDuration
      ? computeProjectDuration()
      : getBaseFieldValue(name) || ''

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

    if (mode === 'view') {
      switch (fd.type) {
        case 'DateTimeField':
          return (fieldValue && dayjs(fieldValue).format('DD/MM/YYYY')) || 'N/A'
        case 'DecimalField':
          return fieldValue
            ? `${monetaryFields.includes(fd.name) ? '$' : ''}${getFormattedNumericValue(fieldValue, 2)}`
            : 'N/A'
        default:
          return fieldValue ? getFormattedNumericValue(fieldValue, 0) : 'N/A'
      }
    } else {
      switch (fd.type) {
        case 'DateTimeField':
          return (
            <div className="w-unset">
              <DateInput
                id={fd.name}
                className={cx(
                  'BPListUpload !ml-0 h-8 w-[130px]',
                  disabledClassName,
                )}
                value={fieldValue.toString()}
                formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
                disabled={true}
              />
            </div>
          )
        case 'DecimalField':
          return (
            <FormattedNumberInput
              id={fd.name}
              className={cx(
                '!m-0 h-8 w-[130px] w-full !border-gray-400 p-2.5',
                disabledClassName,
              )}
              prefixClassName="h-8"
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
                '!m-0 h-8 w-[130px] w-full !border-gray-400 p-2.5',
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
  }

  const renderFieldData = (fieldData: any, isIndividualField: boolean = true) =>
    fieldData.map((fd: any) => {
      const isComputed = valueIsComputed(fd.name)
      const formattedLabel = formatFieldLabel(fd.label)

      return (
        <div key={fd.name} className="py-2">
          {isIndividualField && (
            <Label htmlFor={fd.name} className="font-semibold">
              {formattedLabel}
            </Label>
          )}
          <span className="flex gap-3">
            {fieldComponent(fd)}
            {computedTag(isComputed)}
            {!isIndividualField && groupFieldsMeasurementUnits(formattedLabel)}
          </span>
        </div>
      )
    })

  const groupFields = (fields: any) => (
    <div className="flex w-fit flex-col">
      {groupFieldsLabel(fields)}
      <div className="flex flex-wrap gap-x-6">
        {renderFieldData(fields, false)}
      </div>
    </div>
  )

  return (
    <>
      {!!metaprojectData?.id ? (
        <div className="flex flex-col gap-y-3">
          <Typography variant="h6">
            MYA: {metaprojectData?.umbrella_code}, Lead agency:{' '}
            {metaprojectData?.lead_agency?.name || '-'}
          </Typography>
          <div className="flex gap-x-6">
            <div className="flex-grow">
              {renderFieldData(fieldData.slice(0, 3))}
              <div className="flex flex-wrap gap-x-6">
                {renderFieldData(dateFields)}
              </div>
              {renderFieldData(fieldData.slice(5, 6))}
              {groupFields(baselineFields)}
              {groupFields(targetFields)}
            </div>
            <div className="flex-grow">
              {groupFields(phaseOutFields)}
              {groupFields(startingPointFields)}
              {renderFieldData(fieldData).slice(16, 20)}
              {groupFields(costEffectivenessFields)}
            </div>
          </div>
        </div>
      ) : (
        <CircularProgress color="inherit" size="24px" className="ml-1.5" />
      )}
    </>
  )
}

export default ProjectMyaUpdatesView

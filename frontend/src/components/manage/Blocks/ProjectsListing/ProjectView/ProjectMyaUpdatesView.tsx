import { useCallback, useEffect, useState } from 'react'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import { orderFieldData } from '../UpdateMyaData/MetaProjectEdit'
import {
  computedTag,
  getFilteredFields,
  groupFieldsLabel,
  groupFieldsMeasurementUnits,
} from '../HelperComponents'
import { monetaryFields } from '../UpdateMyaData/constants'
import { disabledClassName } from '../constants'
import { MpDataProps } from '../interfaces'
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
  mpData,
  setMpData,
  mode,
}: MpDataProps & {
  metaprojectData: Partial<MetaProjectDetailType> | null
  mode: string
}) => {
  const { addUpdatedField } = useUpdatedFields()

  const isNewMetaProject = !!metaprojectData?.field_data && !metaprojectData?.id

  const isFieldDisabled = (field: string) =>
    field === projectDuration || !isNewMetaProject

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

  const [crtMpData, setCrtMpData] = useState(formatMetaprojectData)

  useEffect(() => {
    if (!isNewMetaProject) {
      setCrtMpData(formatMetaprojectData)
    }
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

  const changeSimpleInput = useCallback(
    (name: string, opts?: { numeric?: boolean }) => {
      return (evt: any) => {
        setMpData((prev: any) => {
          addUpdatedField(name)

          let newValue = evt.target.value || null
          if (opts?.numeric && isNaN(Number(newValue))) {
            newValue = prev[name]
          }
          return { ...prev, [name]: newValue }
        })
      }
    },
    [setMpData],
  )

  const computeProjectDuration = () =>
    getProjectDuration({
      project_start_date: getBaseFieldValue('start_date'),
      project_end_date: getBaseFieldValue('end_date'),
    })

  const getBaseFieldValue = (name: string) => {
    const formValue = isNewMetaProject ? mpData?.[name] : crtMpData?.[name]
    const computedValue = metaprojectData?.computed_field_data?.[name]

    return formValue === null ? computedValue : formValue
  }

  const getFieldValue = (name: string) =>
    name === projectDuration
      ? computeProjectDuration()
      : getBaseFieldValue(name) || ''

  const valueIsComputed = (name: string) => {
    const formValue = isNewMetaProject ? mpData?.[name] : crtMpData?.[name]
    const computedValue = metaprojectData?.computed_field_data?.[name]

    return (
      name === projectDuration ||
      (formValue === null && computedValue !== undefined)
    )
  }

  useEffect(() => {
    setMpData?.((prev: any) => ({
      ...prev,
      [projectDuration]: computeProjectDuration(),
    }))
  }, [mpData?.start_date, mpData?.end_date])

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
                className={cx('BPListUpload !ml-0 h-8 w-[125px]', {
                  [disabledClassName]: isFieldDisabled(fd.name),
                })}
                value={fieldValue.toString()}
                onChange={changeSimpleInput(fd.name)}
                formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
                disabled={isFieldDisabled(fd.name)}
              />
            </div>
          )
        case 'DecimalField':
          return (
            <FormattedNumberInput
              id={fd.name}
              className={cx(
                '!m-0 h-8 w-[125px] w-full !border-gray-400 p-2.5',
                {
                  [disabledClassName]: isFieldDisabled(fd.name),
                },
              )}
              prefixClassName="h-8"
              withoutDefaultValue={true}
              prefix={monetaryFields.includes(fd.name) ? '$' : ''}
              value={fieldValue}
              onChange={changeSimpleInput(fd.name, { numeric: true })}
              disabled={isFieldDisabled(fd.name)}
            />
          )
        default:
          return (
            <FormattedNumberInput
              id={fd.name}
              className={cx(
                '!m-0 h-8 w-[125px] w-full !border-gray-400 p-2.5',
                {
                  [disabledClassName]: isFieldDisabled(fd.name),
                },
              )}
              withoutDefaultValue={true}
              value={fieldValue}
              onChange={changeSimpleInput(fd.name, {
                numeric: ['IntegerField'].includes(fd.type),
              })}
              decimalDigits={0}
              disabled={isFieldDisabled(fd.name)}
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
    <div className="flex w-fit flex-col py-2">
      {groupFieldsLabel(fields)}
      <div className="flex flex-wrap gap-x-6">
        {renderFieldData(fields, false)}
      </div>
    </div>
  )

  return (
    <>
      {!!metaprojectData?.field_data ? (
        <div className="flex flex-col gap-y-3">
          {!!metaprojectData?.id && (
            <Typography variant="h6">
              MYA: {metaprojectData?.umbrella_code}, Lead agency:{' '}
              {metaprojectData?.lead_agency?.name || '-'}
            </Typography>
          )}
          <div className="flex gap-x-6">
            <div className="flex-grow">
              {renderFieldData(fieldData.slice(0, 3))}
              <div className="flex flex-wrap gap-x-6 py-2">
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

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
  FieldErrorIndicator,
  getFilteredFields,
  groupFieldsLabel,
  groupFieldsMeasurementUnits,
} from '../HelperComponents'
import { disabledClassName, enabledButtonClassname } from '../constants'
import { monetaryFields } from '../UpdateMyaData/constants'
import {
  formatFieldLabel,
  formatMetaprojectData,
  getFormattedNumericValue,
  getProjectDuration,
  hasSectionErrors,
} from '../utils'
import {
  MetaProjectDetailType,
  MetaProjectFieldData,
} from '../UpdateMyaData/types'
import { useStore } from '@ors/store'

import { CircularProgress, Typography, Button } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'

const projectDuration = 'project_duration'

const ProjectMyaUpdatesView = ({
  metaprojectData,
  mode,
}: {
  metaprojectData: Partial<MetaProjectDetailType> | null
  mode: string
}) => {
  const { mpData, setMpData, defaultMpErrors, allMpErrors } = useStore(
    (state) => state.mpData,
  )
  const { setInlineMessage } = useStore((state) => state.inlineMessage)

  const { addUpdatedField } = useUpdatedFields()

  const isNewMetaProject = !!metaprojectData?.field_data && !metaprojectData?.id
  const isSaveDisabled = !isNewMetaProject || hasSectionErrors(defaultMpErrors)

  const isFieldDisabled = (field: string) =>
    field === projectDuration || !isNewMetaProject

  const getFormattedMpdata = useCallback(
    () =>
      formatMetaprojectData(
        metaprojectData?.field_data ?? ({} as MetaProjectFieldData),
      ),
    [metaprojectData],
  )

  const [crtMpData, setCrtMpData] = useState(getFormattedMpdata)

  useEffect(() => {
    if (!isNewMetaProject) {
      setCrtMpData(getFormattedMpdata)
    }
  }, [getFormattedMpdata, metaprojectData])

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
        setMpData((prev) => {
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
    setMpData((prev) => ({
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
            <DateInput
              id={fd.name}
              className={cx('BPListUpload !ml-0 h-8 !w-[125px]', {
                [disabledClassName]: isFieldDisabled(fd.name),
              })}
              value={fieldValue.toString()}
              onChange={changeSimpleInput(fd.name)}
              formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
              disabled={isFieldDisabled(fd.name)}
            />
          )
        case 'DecimalField':
          return (
            <FormattedNumberInput
              id={fd.name}
              className={cx(
                '!m-0 h-8 !w-[125px] w-full !border-gray-400 p-2.5',
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
                '!m-0 h-8 !w-[125px] w-full !border-gray-400 p-2.5',
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
          <span className="flex flex-wrap gap-x-3 gap-y-1.5 sm:flex-nowrap">
            <div className="flex items-center">
              {fieldComponent(fd)}
              <FieldErrorIndicator errors={allMpErrors} field={fd.label} />
            </div>
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

  const onMyaUpdate = () => {
    setInlineMessage({
      type: 'success',
      message:
        'The MYA data is saved as draft. The information will be reviewed and approved by the Secretariat.',
      tabId: 'mya-updates',
    })
  }

  return (
    <>
      {!!metaprojectData?.field_data ? (
        <div className="flex flex-col gap-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!!metaprojectData?.id && (
              <Typography variant="h6">
                MYA: {metaprojectData?.umbrella_code}, Lead agency:{' '}
                {metaprojectData?.lead_agency?.name || '-'}
              </Typography>
            )}
            {mode !== 'view' && (
              <Button
                className={cx('ml-auto h-8 px-4 py-2 shadow-none', {
                  [enabledButtonClassname]: !isSaveDisabled,
                })}
                size="large"
                variant="contained"
                onClick={onMyaUpdate}
                disabled={isSaveDisabled}
              >
                Save
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 lg:flex-nowrap">
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

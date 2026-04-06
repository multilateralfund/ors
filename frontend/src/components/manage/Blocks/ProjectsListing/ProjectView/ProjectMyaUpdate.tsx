import { useCallback, useEffect } from 'react'

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
  getFormattedNumericValue,
  getNonFieldErrors,
  getProjectDuration,
  hasSectionErrors,
} from '../utils'
import { MetaProjectDetailType } from '../UpdateMyaData/types'
import { useStore } from '@ors/store'
import { api } from '@ors/helpers'

import { CircularProgress, Typography, Button } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import cx from 'classnames'
import dayjs from 'dayjs'

const projectDuration = 'project_duration'

const ProjectMyaUpdate = ({
  metaprojectData,
  mode,
  setErrors,
}: {
  metaprojectData: Partial<MetaProjectDetailType> | null
  mode: string
  setErrors?: (value: { [key: string]: [] }) => void
}) => {
  const { mpData, setMpData, loadingMpData, defaultMpErrors, allMpErrors } =
    useStore((state) => state.mpData)
  const { setInlineMessage } = useStore((state) => state.inlineMessage)

  const { addUpdatedField, clearUpdatedFields } = useUpdatedFields()

  const isDraftMetaProject = metaprojectData?.is_draft
  const isSaveDisabled =
    !isDraftMetaProject || hasSectionErrors(defaultMpErrors)

  const isFieldDisabled = (field: string) =>
    field === projectDuration || !isDraftMetaProject

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
      project_start_date: mpData?.['start_date'],
      project_end_date: mpData?.['end_date'],
    })

  const getFieldValue = (name: string) =>
    name === projectDuration ? computeProjectDuration() : mpData?.[name] || ''

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
      const isComputed = fd.name === projectDuration && mode !== 'view'
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

  const onMyaUpdate = async () => {
    try {
      await api(`api/meta-projects/${metaprojectData?.id}/`, {
        data: mpData,
        method: 'PUT',
      })
      setInlineMessage({
        type: 'success',
        message:
          'The MYA data is saved as draft. The information will be reviewed and approved by the Secretariat.',
        tabId: 'mya-updates',
      })
      clearUpdatedFields()
    } catch (error) {
      const errors =
        error && typeof error.json === 'function' ? await error.json() : {}

      if (error.status === 400) {
        setErrors?.(errors)

        const nonFieldErrors = getNonFieldErrors(errors)
        if (nonFieldErrors.length > 0) {
          setInlineMessage({
            type: 'error',
            errorMessages: nonFieldErrors,
          })
        }

        if (errors?.details) {
          setInlineMessage({
            type: 'error',
            message: errors.details,
          })
        }
      }

      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  if (metaprojectData?.detail) {
    return (
      <>
        No corresponding metaproject was found. A metaproject will be created
        automatically when the project is created.
      </>
    )
  }

  if (!loadingMpData && !metaprojectData?.id) {
    return <>This project does not belong to any metaproject.</>
  }

  return (
    <div className="rounded-lg bg-common-containerBg px-6 py-2">
      {!loadingMpData && !!metaprojectData?.id ? (
        <div className="flex flex-col gap-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Typography variant="h6">
              MYA: {metaprojectData?.umbrella_code}, Lead agency:{' '}
              {metaprojectData?.lead_agency?.name || '-'}
            </Typography>

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
    </div>
  )
}

export default ProjectMyaUpdate

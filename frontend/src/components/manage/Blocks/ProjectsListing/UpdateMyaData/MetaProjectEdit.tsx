import { useCallback, useEffect, useState } from 'react'

import {
  MetaProjectDetailType,
  MetaProjectFieldData,
} from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'
import { api, getResults } from '@ors/helpers'
import { ProjectType } from '@ors/types/api_projects.ts'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import PListingTable from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PListingTable.tsx'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import CancelWarningModal from '../ProjectSubmission/CancelWarningModal'
import { disabledClassName } from '../constants'
import { monetaryFields } from './constants'
import {
  formatFieldLabel,
  getFormattedDecimalValue,
  getProjectDuration,
} from '../utils'

import { useSnackbar } from 'notistack'
import { values } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

const projectDuration = 'project_duration'

export const orderFieldData = (fd: MetaProjectFieldData) => {
  const orderedFieldData = []

  for (const key of Object.keys(fd)) {
    orderedFieldData.push({ name: key, ...fd[key] })
  }
  orderedFieldData.sort((a, b) => a.order - b.order)

  return orderedFieldData
}

export const MetaProjectEdit = (props: {
  mp: MetaProjectDetailType
  refreshMetaProjectDetails: () => void
  onCancel: () => void
}) => {
  const { mp, refreshMetaProjectDetails, onCancel } = props

  const { updatedFields, addUpdatedField, clearUpdatedFields } =
    useUpdatedFields()

  useEffect(() => {
    clearUpdatedFields()
  }, [])

  useVisibilityChange(updatedFields.size > 0)

  const { enqueueSnackbar } = useSnackbar()

  const projects = getResults<ProjectType>(mp?.projects ?? [])

  const loadInitialState = useCallback(() => {
    const result = {} as Record<string, any>
    const fd = mp?.field_data ?? ({} as MetaProjectFieldData)

    for (const key of Object.keys(fd)) {
      const fdEntry = fd[key as keyof MetaProjectFieldData]
      result[key] =
        fdEntry.type === 'DecimalField'
          ? getFormattedDecimalValue(fdEntry.value as string)
          : fdEntry.value
    }

    return result
  }, [mp])

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [form, setForm] = useState(loadInitialState)

  useEffect(() => {
    setForm(loadInitialState)
  }, [loadInitialState, mp])

  const fieldData = orderFieldData(mp?.field_data ?? {})

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSave = async () => {
    try {
      const result = await api(`api/meta-projects/${mp.id}/`, {
        data: form,
        method: 'PUT',
      })
      refreshMetaProjectDetails()
      enqueueSnackbar('Saved!', { variant: 'success' })
      clearUpdatedFields()
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()

        setFieldErrors(errors)

        enqueueSnackbar(<>{values(errors)[0]}</>, {
          variant: 'error',
        })
      } else {
        enqueueSnackbar(<>An error occurred. Please try again.</>, {
          variant: 'error',
        })
      }
    }
  }

  const changeSimpleInput = useCallback(
    (name: string, opts?: { numeric?: boolean }) => {
      return (evt: any) => {
        setForm((prev) => {
          addUpdatedField(name)

          let newValue = evt.target.value || null
          if (opts?.numeric && isNaN(Number(newValue))) {
            newValue = prev[name]
          }
          return { ...prev, [name]: newValue }
        })
      }
    },
    [setForm],
  )

  const computeProjectDuration = () =>
    getProjectDuration({
      project_start_date: getBaseFieldValue('start_date'),
      project_end_date: getBaseFieldValue('end_date'),
    })

  const getBaseFieldValue = (name: string) => {
    const formValue = form[name]
    const computedValue = mp.computed_field_data[name]

    return formValue === null ? computedValue : formValue
  }

  const getFieldValue = (name: string, missing?: string) =>
    name === projectDuration
      ? computeProjectDuration()
      : getBaseFieldValue(name) || (missing ?? '')

  const valueIsComputed = (name: string) => {
    const formValue = form[name]
    const computedValue = mp.computed_field_data[name]

    return (
      name === projectDuration ||
      (formValue === null && computedValue !== undefined)
    )
  }

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      [projectDuration]: computeProjectDuration(),
    }))
  }, [form.start_date, form.end_date])

  const fieldComponent = (fd: any) => {
    const fieldValue = getFieldValue(fd.name)
    const isFieldDisabled = fd.name === projectDuration

    switch (fd.type) {
      case 'DateTimeField':
        return (
          <DateInput
            id={fd.name}
            className="BPListUpload !ml-0 h-9"
            value={fieldValue.toString()}
            formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
            onChange={changeSimpleInput(fd.name)}
          />
        )
      case 'DecimalField':
        return (
          <FormattedNumberInput
            id={fd.name}
            className="!m-0 h-9 w-full !border-gray-400 p-2.5"
            withoutDefaultValue={true}
            prefix={monetaryFields.includes(fd.name) ? '$' : ''}
            value={fieldValue}
            onChange={changeSimpleInput(fd.name, { numeric: true })}
          />
        )
      default:
        return (
          <FormattedNumberInput
            id={fd.name}
            className={cx('!m-0 h-9 w-full !border-gray-400 p-2.5', {
              [disabledClassName]: isFieldDisabled,
            })}
            withoutDefaultValue={true}
            value={fieldValue}
            decimalDigits={0}
            disabled={isFieldDisabled}
            onChange={changeSimpleInput(fd.name, {
              numeric: ['IntegerField'].includes(fd.type),
            })}
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
            <span
              className={cx('mt-2 font-semibold', {
                'text-red-500': fieldErrors[fd.name],
              })}
            >
              {formatFieldLabel(fd.label)}
            </span>
          </Label>
          <span className="mt-2 flex gap-2">
            {fieldComponent(fd)}
            {isComputed ? (
              <span
                className="border-1 flex items-center rounded-lg border border-solid border-[#2E708E] px-1 italic text-[#2E708E]"
                title="Based on contained projects."
              >
                Computed
              </span>
            ) : null}
          </span>
          {fieldErrors[fd.name] ? (
            <Typography variant={'subtitle1'} className={'text-red-500'}>
              {fieldErrors[fd.name]}
            </Typography>
          ) : null}
        </div>
      )
    })
  }

  const onCancelUpdate = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      onCancel()
    }
  }

  return (
    <>
      <Dialog open={!!mp?.id} fullWidth={true} maxWidth={'xl'}>
        <DialogTitle>
          MYA: {mp?.umbrella_code}, Lead agency: {mp?.lead_agency?.name || '-'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6">Projects under this MYA</Typography>
          <PListingTable
            mode="listing"
            projects={projects as any}
            filters={{}}
            enablePagination={false}
          />
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
        </DialogContent>
        <DialogActions>
          <Button
            className="hover:bg-white hover:text-primary"
            onClick={onCancelUpdate}
          >
            Close
          </Button>
          <Button
            className="bg-primary text-white hover:text-mlfs-hlYellow"
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {isCancelModalOpen && (
        <CancelWarningModal
          mode="MYA data update"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
          onContinueAction={onCancel}
        />
      )}
    </>
  )
}

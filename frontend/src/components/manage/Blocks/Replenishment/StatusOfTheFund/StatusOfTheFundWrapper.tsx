'use client'

import { ChangeEvent, useContext, useState } from 'react'

import cx from 'classnames'
import { useSnackbar } from 'notistack'

import useGetDashboardData from '@ors/components/manage/Blocks/Replenishment/Dashboard/useGetDashboardData'
import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FormattedNumberInput,
  IFieldProps,
  IFormattedNumberInputProps,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { api } from '@ors/helpers'

import { IFormData } from '../Dashboard/useGetDashboardDataTypes'
import StatusOfTheFundView from '../StatusOfTheFund/StatusOfTheFundView'

function InputNumberField(props: IFieldProps & IFormattedNumberInputProps) {
  const { id, className, label, ...fieldProps } = props
  return (
    <div className="flex w-72 flex-col">
      <label htmlFor={`${id}_mask`}>
        <div className="flex flex-col text-primary">
          <span className="font-medium">{label}</span>
        </div>
      </label>
      <FormattedNumberInput
        id={id}
        className={cx('!ml-0', className)}
        {...fieldProps}
      />
    </div>
  )
}

interface IEditStatusDialogProps extends React.PropsWithChildren {
  data: IFormData
  onCancel: () => void
  onSubmit: (
    formData: Record<string, number | string>,
    evt?: React.FormEvent,
  ) => void
}

function EditStatusDialog(props: IEditStatusDialogProps) {
  const { data, onSubmit, ...dialogProps } = props

  const [formState, setFormState] = useState<IFormData>(data)

  function handleChange(name: string) {
    return function (evt: ChangeEvent<HTMLInputElement>) {
      const value = parseFloat(evt.target.value)
      if (
        evt.target.value === '' ||
        (typeof value === 'number' && !isNaN(value))
      ) {
        setFormState(function (prev) {
          return { ...prev, [name]: value }
        })
      }
    }
  }

  function handleExternalIncomeYearChange(name: string) {
    return function (evt: ChangeEvent<HTMLInputElement>) {
      const value = parseInt(evt.target.value)
      if (
        evt.target.value === '' ||
        (typeof value === 'number' && !isNaN(value))
      ) {
        setFormState(function (prev) {
          return { ...prev, [name]: value }
        })
      }
    }
  }

  function handleSubmit() {
    onSubmit(formState)
  }

  return (
    <FormDialog
      title="Status of the fund:"
      onSubmit={handleSubmit}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <h3 className="m-0 uppercase">Income</h3>
        <div className="flex gap-x-4">
          <InputNumberField
            id="external_income_start_year"
            label="Start year of external income"
            value={formState['external_income_start_year']}
            onChange={handleExternalIncomeYearChange(
              'external_income_start_year',
            )}
            onlyNumber
          />
          <InputNumberField
            id="external_income_end_year"
            label="End year of external income"
            value={formState['external_income_end_year']}
            onChange={handleExternalIncomeYearChange(
              'external_income_end_year',
            )}
            onlyNumber
          />
        </div>
        <div className="flex gap-x-4">
          <InputNumberField
            id="interest_earned"
            label="Interest earned"
            value={formState['interest_earned']}
            onChange={handleChange('interest_earned')}
          />
          <InputNumberField
            id="miscellaneous_income"
            label="Miscellaneous income"
            value={formState['miscellaneous_income']}
            onChange={handleChange('miscellaneous_income')}
          />
        </div>
        <h3 className="m-0 my-4 uppercase">Allocations and provisions</h3>
        <div className="flex gap-x-4">
          <InputNumberField
            id="undp"
            label="UNDP"
            value={formState['undp']}
            onChange={handleChange('undp')}
          />
          <InputNumberField
            id="unep"
            label="UNEP"
            value={formState['unep']}
            onChange={handleChange('unep')}
          />
        </div>
        <div className="flex gap-x-4">
          <InputNumberField
            id="unido"
            label="UNIDO"
            value={formState['unido']}
            onChange={handleChange('unido')}
          />
          <InputNumberField
            id="world_bank"
            label="World Bank"
            value={formState['world_bank']}
            onChange={handleChange('world_bank')}
          />
        </div>

        <div className="my-4 border border-x-0 border-b-0 border-solid border-gray-200"></div>

        <div className="flex gap-x-4">
          <InputNumberField
            id="staff_contracts"
            label="Secretariat and Executive Committee costs"
            value={formState['staff_contracts']}
            onChange={handleChange('staff_contracts')}
          />
          <InputNumberField
            id="monitoring_fees"
            label="Monitoring and Evaluation costs"
            value={formState['monitoring_fees']}
            onChange={handleChange('monitoring_fees')}
          />
        </div>

        <div className="flex gap-x-4">
          <InputNumberField
            id="information_strategy"
            label="Information Strategy costs "
            value={formState['information_strategy']}
            onChange={handleChange('information_strategy')}
          />
          <InputNumberField
            id="bilateral_assistance"
            label="Bilateral cooperation"
            value={formState['bilateral_assistance']}
            onChange={handleChange('bilateral_assistance')}
          />
        </div>
      </div>
    </FormDialog>
  )
}

function StatusOfTheFundWrapper() {
  const { formData, invalidateDataFn, newData } = useGetDashboardData()
  const ctx = useContext(ReplenishmentContext)
  const { allocations, asOfDate, income, overview, provisions } = newData

  const [showEdit, setShowEdit] = useState(false)

  const { enqueueSnackbar } = useSnackbar()

  function handleEditClick() {
    setShowEdit(!showEdit)
  }

  function handleEditCancel() {
    setShowEdit(false)
  }

  /**
   * Handle form submit. This receives an object, instead of a FormData.
   */
  function handleEditSubmit(data: Record<string, number | string>) {
    const parsedData: Record<string, number> = {}
    const dataKeys = Object.keys(data)
    for (let i = 0; i < dataKeys.length; i++) {
      parsedData[dataKeys[i]] = parseFloat(data[dataKeys[i]] as string) || 0
    }

    api('/api/replenishment/dashboard', {
      data: parsedData,
      method: 'PUT',
    })
      .then(() => {
        invalidateDataFn({
          cache_bust: crypto.randomUUID(),
        })
        enqueueSnackbar('Data updated successfully', { variant: 'success' })
        handleEditCancel()
      })
      .catch(() => {
        enqueueSnackbar('Failed to update data', { variant: 'error' })
      })
  }

  return (
    <>
      {showEdit ? (
        <EditStatusDialog
          data={formData as IFormData}
          onCancel={handleEditCancel}
          onSubmit={handleEditSubmit}
        />
      ) : null}
      <StatusOfTheFundView
        allocations={allocations}
        asOfDate={asOfDate}
        income={income}
        overview={overview}
        provisions={provisions}
        showEditButton={ctx.isTreasurer}
        onEditButtonClick={handleEditClick}
      />
    </>
  )
}

export default StatusOfTheFundWrapper

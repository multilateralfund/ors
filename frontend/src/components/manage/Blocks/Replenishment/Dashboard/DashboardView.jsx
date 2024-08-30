'use client'

import { useContext, useState } from 'react'

import cx from 'classnames'
import { useSnackbar } from 'notistack'

import useGetDashboardData from '@ors/components/manage/Blocks/Replenishment/Dashboard/useGetDashboardData'
import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import { FormattedNumberInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { api } from '@ors/helpers'

import SectionDashboard from './SectionDashboard'
import SectionStatistics from './SectionStatistics'
import SectionStatus from './SectionStatus'

function InputField(props) {
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

function EditStatusDialog(props) {
  const { data, onSubmit, ...dialogProps } = props

  const [formState, setFormState] = useState(data)

  function handleChange(name) {
    return function (evt) {
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

  function handleExternalIncomeYearChange(name) {
    return function (evt) {
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
          <InputField
            id="external_income_start_year"
            label="Start year of external income"
            value={formState['external_income_start_year']}
            onChange={handleExternalIncomeYearChange(
              'external_income_start_year',
            )}
            onlyNumber
          />
          <InputField
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
          <InputField
            id="interest_earned"
            label="Interest earned"
            value={formState['interest_earned']}
            onChange={handleChange('interest_earned')}
          />
          <InputField
            id="miscellaneous_income"
            label="Miscellaneous income"
            value={formState['miscellaneous_income']}
            onChange={handleChange('miscellaneous_income')}
          />
        </div>
        <h3 className="m-0 my-4 uppercase">Allocations and provisions</h3>
        <div className="flex gap-x-4">
          <InputField
            id="undp"
            label="UNDP"
            value={formState['undp']}
            onChange={handleChange('undp')}
          />
          <InputField
            id="unep"
            label="UNEP"
            value={formState['unep']}
            onChange={handleChange('unep')}
          />
        </div>
        <div className="flex gap-x-4">
          <InputField
            id="unido"
            label="UNIDO"
            value={formState['unido']}
            onChange={handleChange('unido')}
          />
          <InputField
            id="world_bank"
            label="World Bank"
            value={formState['world_bank']}
            onChange={handleChange('world_bank')}
          />
        </div>

        <div className="my-4 border border-x-0 border-b-0 border-solid border-gray-200"></div>

        <div className="flex gap-x-4">
          <InputField
            id="staff_contracts"
            label="Secretariat and Executive Committee costs"
            value={formState['staff_contracts']}
            onChange={handleChange('staff_contracts')}
          />
          <InputField
            id="monitoring_fees"
            label="Monitoring and Evaluation costs"
            value={formState['monitoring_fees']}
            onChange={handleChange('monitoring_fees')}
          />
        </div>

        <div className="flex gap-x-4">
          <InputField
            id="information_strategy"
            label="Information Strategy costs "
            value={formState['information_strategy']}
            onChange={handleChange('information_strategy')}
          />
          <InputField
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

function DashboardView(props) {
  const { period, section } = props
  const { formData, invalidateDataFn, loading, newData } = useGetDashboardData()
  const ctx = useContext(ReplenishmentContext)
  const { allocations, asOfDate, charts, income, overview, provisions } = newData

  const [showEdit, setShowEdit] = useState(false)

  const { enqueueSnackbar } = useSnackbar()

  function handleEditClick() {
    setShowEdit(!showEdit)
  }

  function handleEditCancel() {
    setShowEdit(false)
  }

  function handleEditSubmit(data) {
    const parsedData = {}
    const dataKeys = Object.keys(data)
    for (let i = 0; i < dataKeys.length; i++) {
      parsedData[dataKeys[i]] = parseFloat(data[dataKeys[i]]) || 0
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

  console.log("OVERVIEW", overview)

  let Section

  switch (section) {
    case 'status':
      Section = (
        <SectionStatus
          allocations={allocations}
          asOfDate={asOfDate}
          income={income}
          overview={overview}
          provisions={provisions}
          showEditButton={ctx.isTreasurer}
          onEditButtonClick={handleEditClick}
        />
      )
      break
    case 'statistics':
      Section = <SectionStatistics />
      break
    default:
      Section = (
        <SectionDashboard
          charts={charts}
          data={newData}
          period={period}
          tab={section}
        />
      )
      break
  }

  return (
    <>
      {showEdit ? (
        <EditStatusDialog
          data={formData}
          onCancel={handleEditCancel}
          onSubmit={handleEditSubmit}
        />
      ) : null}
      {Section}
    </>
  )
}

export default DashboardView

'use client'

import { useContext, useState } from 'react'

import cx from 'classnames'
import { useSnackbar } from 'notistack'

import BarChart from '@ors/components/manage/Blocks/Replenishment/Dashboard/BarChart'
import FilledAreaChart from '@ors/components/manage/Blocks/Replenishment/Dashboard/FilledAreaChart'
import TwoAreaCharts from '@ors/components/manage/Blocks/Replenishment/Dashboard/TwoAreaCharts'
import useGetDashboardData from '@ors/components/manage/Blocks/Replenishment/Dashboard/useGetDashboardData'
import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import { FormattedNumberInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils'
import Loading from '@ors/components/theme/Loading/Loading'
import { SubmitButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { api } from '@ors/helpers'

const overviewOrder = ['balance', 'payment_pledge_percentage', 'gain_loss']
const overviewIndicatorsOrder = [
  'advance_contributions',
  'contributions',
  'outstanding_contributions',
]
const incomeOrder = [
  'cash_payments',
  'promissory_notes',
  'bilateral_assistance',
  'interest_earned',
  'miscellaneous_income',
  'total',
]
const allocationsOrder = ['undp', 'unep', 'unido', 'world_bank', 'total']
const provisionsOrder = [
  'staff_contracts',
  'treasury_fees',
  'monitoring_fees',
  'technical_audit',
  'information_strategy',
  'bilateral_assistance',
  'total',
]

function SummaryCard(props) {
  const { label, percentage, value } = props
  return (
    <div className="flex min-h-36 flex-1 flex-col justify-between rounded-lg bg-[#F5F5F5] p-4 print:break-inside-avoid">
      <div className="text-xl font-medium uppercase">{label}</div>
      <div className="text-5xl font-bold leading-normal">
        {value}
        {percentage && '%'}
      </div>
    </div>
  )
}

function CashCard(props) {
  const { className, label, sub_text, value } = props
  return (
    <li
      className={cx(
        ' flex min-h-24 min-w-80 flex-1 items-center justify-between rounded-lg bg-[#F5F5F5] p-4 md:min-w-96 print:break-inside-avoid',
        className,
      )}
    >
      <div className="">
        <div className="text-xl font-medium">{label}</div>
        <div className="text-lg font-normal">{sub_text}</div>
      </div>
      <div className="text-2xl font-bold leading-normal">{value}</div>
    </li>
  )
}

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
      if (typeof value === 'number' && !isNaN(value)) {
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

        <div className="flex gap-x-4">
          <InputField
            id="provision_for_ferm_fluctuations"
            label="Provision for FERM fluctuations"
            value={formState['provision_for_ferm_fluctuations']}
            onChange={handleChange('provision_for_ferm_fluctuations')}
          />
        </div>
      </div>
    </FormDialog>
  )
}

const DashboardIndicators = ({ data }) => {
  return (
    <div className="my-5 flex flex-wrap items-stretch gap-4 text-primary">
      {data &&
        overviewIndicatorsOrder.map((key) => (
          <div
            key={key}
            className="flex flex-1 items-center justify-between gap-4 rounded-lg bg-[#F5F5F5] p-4 print:break-inside-avoid"
          >
            <span className="text-6xl font-bold print:text-4xl">
              {data[key].value}
            </span>
            <span className="text-2xl font-medium print:text-lg">
              {data[key].label}
            </span>
          </div>
        ))}
    </div>
  )
}

function DashboardView() {
  const { formData, invalidateDataFn, loading, newData } = useGetDashboardData()
  const ctx = useContext(ReplenishmentContext)
  const {
    allocations,
    charts,
    income,
    overview,
    overviewIndicators,
    provisions,
  } = newData

  const [showEdit, setShowEdit] = useState(false)

  const { enqueueSnackbar } = useSnackbar()

  if (loading) {
    return <Loading />
  }

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
      parsedData[dataKeys[i]] = parseFloat(data[dataKeys[i]]) ?? 0
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h2 className="m-0 text-3xl">STATUS OF THE FUND</h2>
          <p className="m-0 text-3xl">as of 15 May 2024 ( US Dollars )</p>
        </div>
        {ctx.isTreasurer && (
          <SubmitButton
            className="tracking-widest print:hidden"
            onClick={handleEditClick}
          >
            Edit
          </SubmitButton>
        )}
      </div>

      {showEdit ? (
        <EditStatusDialog
          data={formData}
          onCancel={handleEditCancel}
          onSubmit={handleEditSubmit}
        />
      ) : null}

      <div
        className="grid auto-rows-auto grid-cols-1 gap-4 lg:grid-cols-5 print:block"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <div className="lg:col-span-3 print:flex print:flex-col print:gap-4">
          <div className="print:break-inside-avoid">
            <h3 className="text-2xl">OVERVIEW</h3>

            <div className="flex flex-wrap items-stretch gap-4">
              {overview &&
                overviewOrder.map((key) => (
                  <SummaryCard
                    key={key}
                    label={overview[key].label}
                    percentage={overview[key].percentage}
                    value={
                      overview[key].value !== null
                        ? formatNumberValue(overview[key].value, 0, 0)
                        : 'N/A'
                    }
                  />
                ))}
            </div>
            <DashboardIndicators data={overviewIndicators} />
          </div>
          <div className="print:break-inside-avoid">
            <h3 className="text-2xl">INCOME</h3>

            <ul className="flex list-none flex-wrap items-stretch gap-4 pl-0">
              {income &&
                incomeOrder.map((key) => (
                  <CashCard
                    key={key}
                    className={key === 'total' ? '!bg-primary text-white' : ''}
                    label={income[key].label}
                    value={
                      income[key].value !== null
                        ? formatNumberValue(income[key].value, 0, 0)
                        : 'N/A'
                    }
                  />
                ))}
            </ul>
          </div>
          <div className="print:break-inside-avoid">
            <h3 className="text-2xl">ALLOCATIONS AND PROVISIONS</h3>

            <ul className="flex list-none flex-wrap items-stretch gap-4 pl-0">
              {allocations &&
                allocationsOrder.map((key) => (
                  <CashCard
                    key={key}
                    className={key === 'total' ? '!bg-primary text-white' : ''}
                    label={allocations[key].label}
                    value={
                      allocations[key].value !== null
                        ? formatNumberValue(allocations[key].value, 0, 0)
                        : 'N/A'
                    }
                  />
                ))}
            </ul>
            <ul className="flex list-none flex-wrap justify-between gap-4 pl-0">
              {provisions &&
                provisionsOrder.map((key) => (
                  <CashCard
                    key={key}
                    className={
                      key === 'total' ? 'ml-auto !bg-primary text-white' : ''
                    }
                    label={provisions[key].label}
                    sub_text={provisions[key].sub_text}
                    value={
                      provisions[key].value !== null
                        ? formatNumberValue(provisions[key].value, 0, 0)
                        : 'N/A'
                    }
                  />
                ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 lg:col-start-4">
          <br className="m-5 leading-7" />
          <div className="flex w-full flex-col">
            {charts && (
              <>
                <div className="print:break-inside-avoid">
                  <h3 className="text-2xl uppercase">
                    Outstanding pledges for closed triennials
                  </h3>
                  <BarChart
                    data={charts.outstanding_pledges}
                    title="Outstanding pledges for closed triennials"
                  />
                </div>
                <div className="print:break-inside-avoid">
                  <h3 className="text-2xl uppercase">Pledged Contributions</h3>
                  <FilledAreaChart
                    data={charts.pledged_contributions}
                    title="Pledged Contributions"
                  />
                </div>
                <div className="print:break-inside-avoid">
                  <h3 className="text-2xl uppercase">
                    Pledged Contributions vs. total payments
                  </h3>
                  <TwoAreaCharts
                    data={charts}
                    title="Pledged Contributions vs total payments"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div>
        <p className="my-0">
          <sup>*</sup> Includes interest amount US $1,553,069 earned by FECO/MEP
          (China).
        </p>
        <p className="my-0">
          <sup>**</sup> Amounts reflect net approvals for which resources are
          transferred to Implementing Agencies. The Secretariat budget reflects
          actual costs as per the final 2021 and preliminary 2022 accounts of
          the Fund and approved amounts for 2020 - 2025.
        </p>
        <p className="my-0">
          <sup>***</sup> This amount includes US $246 million balance carried
          forward from 2018-2020 triennium, which is to be used after 2023 as
          per the fifth extraordinary MoP decision Ex.V/1(2){' '}
        </p>
      </div>
    </>
  )
}

export default DashboardView

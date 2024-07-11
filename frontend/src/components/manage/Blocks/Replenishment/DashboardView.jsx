'use client'

import { useState } from 'react'

import cx from 'classnames'

import { SubmitButton } from '@ors/components/ui/Button/Button'

import FormDialog from './FormDialog'
import { FormattedNumberInput } from './Inputs'
import { formatNumberValue } from './utils'

const INCOME = [
  {
    field: 'cash_payments',
    label: 'Cash payments including note encashments',
  },
  {
    field: 'promissory_notes',
    label: 'Promissory notes held',
  },
  {
    field: 'bilateral_cooperation',
    label: 'Bilateral cooperation',
  },
  {
    field: 'interest_earned',
    label: 'Interest earned',
    labelRich: (
      <>
        Interest earned <sup>*</sup>
      </>
    ),
  },
  {
    field: 'miscellaneous_income',
    label: 'Miscellaneous income',
  },
  {
    field: 'total_income',
    label: 'Total Income',
  },
]

const DATA_INCOME = {
  bilateral_cooperation: 187767175,
  cash_payments: 4239242826,
  interest_earned: 256310311,
  miscellaneous_income: 21841581,
  promissory_notes: 0,
  total_income: 4705161892,
}

const ALLOCATIONS = [
  { field: 'undp', label: 'UNDP' },
  { field: 'unep', label: 'UNEP' },
  { field: 'unido', label: 'UNIDO' },
  { field: 'world_bank', label: 'World Bank' },
  { field: 'unspecified_projects', label: 'Unspecified projects' },
  { field: 'less_adjustments', label: 'Less Adjustments' },
  { className: '!bg-transparent' },
  {
    className: '!bg-primary text-white',
    field: 'total_allocations_to_implementing_agencies',
    label: 'Total allocations to implementing agencies',
  },
]

const DATA_ALLOCATIONS = {
  less_adjustments: '-',
  total_allocations_to_implementing_agencies: 3786341238,
  undp: 1029932433,
  unep: 423780713,
  unido: 1022487150,
  unspecified_projects: '-',
  world_bank: 1310140942,
}

const PROVISIONS = [
  {
    field: 'secretariat_and_executive_committee_costs',
    label: 'Secretariat and Executive Committee costs (1991-2025)',
    sub: '(includes provision for staff contracts into 2025)',
  },
  {
    field: 'treasury_fees',
    label: 'Treasury fees (2003-2025)',
  },
  {
    field: 'monitoring_and_evaluation_costs',
    label: 'Monitoring and Evaluation costs (1999-2023)',
  },
  {
    field: 'technical_audit_costs',
    label: 'Technical Audit costs (1998-2010)',
  },
  {
    field: 'information_strategy_costs',
    label: 'Information Strategy costs (2003-2004)',
    sub: '(includes provision for Network maintenance costs for 2004)',
  },
  {
    field: 'bilateral_cooperation',
    label: 'Bilateral cooperation',
  },
  {
    field: 'provision_for_ferm_fluctuations',
    label: "Provision for fixed-exchange-rate mechanism's fluctuations",
    sub: '(losses/(gains) in value)',
  },
  {
    className: '!bg-primary text-white',
    field: 'total_allocations_and_provisions',
    label: 'Total allocations and provisions',
  },
]

const DATA_PROVISIONS = {
  bilateral_cooperation: 187767175,
  information_strategy_costs: 104750,
  monitoring_and_evaluation_costs: 3812244,
  provision_for_ferm_fluctuations: 29540239,
  secretariat_and_executive_committee_costs: 161339318,
  technical_audit_costs: 1699806,
  total_allocations_and_provisions: 4182161753,
  treasury_fees: 11556982,
}

const TOTAL = [
  {
    field: 'cash',
    label: (
      <>
        Cash<sup>***</sup>
      </>
    ),
  },
  { label: 'Promissory Notes:' },
  { className: '!bg-transparent' },
  {
    className: '!bg-primary text-white',
    field: 'balance_available_for_new_allocations',
    label: 'BALANCE AVAILABLE FOR NEW ALLOCATIONS',
  },
]

const DATA_TOTAL = {
  balance_available_for_new_allocations: 523000140,
  cash: 523000140,
}

function ListItem(props) {
  const { label, value } = props
  return (
    <li className={cx('mb-2 flex', props.className)}>
      <span className={cx('font-bold', { 'w-80': value })}>{label}</span>
      {value && <span className="ml-0">{value}</span>}
    </li>
  )
}

function SummaryCard(props) {
  const { label, value } = props
  return (
    <div className="flex h-[150px] flex-col justify-between rounded-lg bg-[#F5F5F5] px-4 py-4">
      <div className="text-xl font-medium uppercase">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function CashCard(props) {
  const { className, label, sub, value } = props
  return (
    <li
      className={cx(
        'flex h-[90px] w-[516px] items-center justify-between rounded-lg bg-[#F5F5F5] px-4 py-4',
        className,
      )}
    >
      <div className="w-[280px]">
        <div className="text-xl font-medium">{label}</div>
        <div className="text-lg font-normal">{sub}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
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
            id="secretariat_costs"
            label="Secretariat and Executive Committee costs"
            value={formState['secretariat_costs']}
            onChange={handleChange('secretariat_costs')}
          />
          <InputField
            id="monitoring_and_evaluation_costs"
            label="Monitoring and Evaluation costs"
            value={formState['monitoring_and_evaluation_costs']}
            onChange={handleChange('monitoring_and_evaluation_costs')}
          />
        </div>

        <div className="flex gap-x-4">
          <InputField
            id="information_strategy_costs"
            label="Information Strategy costs "
            value={formState['information_strategy_costs']}
            onChange={handleChange('information_strategy_costs')}
          />
          <InputField
            id="bilateral_cooperation"
            label="Bilateral cooperation"
            value={formState['bilateral_cooperation']}
            onChange={handleChange('bilateral_cooperation')}
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

function DashboardView() {
  const [showEdit, setShowEdit] = useState(false)
  const [data, setData] = useState({
    ...DATA_INCOME,
    ...DATA_ALLOCATIONS,
    ...DATA_PROVISIONS,
    ...DATA_TOTAL,
  })

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
    console.log(data, parsedData)
    setData(function (prev) {
      return { ...prev, ...parsedData }
    })
    setShowEdit(false)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="m-0 text-3xl">STATUS OF THE FUND</h2>
          <p className="m-0 text-xl">as of 15 May 2024 ( US Dollars )</p>
        </div>
        <SubmitButton className="tracking-widest" onClick={handleEditClick}>
          Edit
        </SubmitButton>
      </div>

      {showEdit ? (
        <EditStatusDialog
          data={data}
          onCancel={handleEditCancel}
          onSubmit={handleEditSubmit}
        />
      ) : null}

      <div className="flex gap-x-4">
        <div className="w-7/12">
          <h3 className="text-2xl">OVERVIEW</h3>

          <div className="flex items-center gap-x-4">
            <SummaryCard label="Cash fund ballance" value={'NNN,NNN,NNN'} />
            <SummaryCard
              label="Ballance available for 2021-2023"
              value={'NNN,NNN,NNN'}
            />
            <SummaryCard
              label="Pledge contribution received for 2021-2023"
              value={'89%'}
            />
            <SummaryCard label="FERM loss" value={'NN,NNN,NNN'} />
          </div>

          <h3 className="text-2xl">INCOME</h3>

          <ul className="flex list-none flex-wrap gap-4 pl-0">
            {INCOME.map(function (o) {
              return (
                <CashCard
                  key={o.field}
                  label={o.labelRich ?? o.label}
                  value={formatNumberValue(data[o.field], 0, 0)}
                />
              )
            })}
          </ul>

          <h3 className="text-2xl">
            ALLOCATIONS<sup>**</sup> AND PROVISIONS
          </h3>

          <ul className="flex list-none flex-wrap gap-4 pl-0">
            {ALLOCATIONS.map(function (o) {
              const value = data[o.field]
              return (
                <CashCard
                  key={o.field}
                  value={isNaN(value) ? value : formatNumberValue(value, 0, 0)}
                  {...o}
                />
              )
            })}
          </ul>
          <ul className="flex list-none flex-wrap gap-4 pl-0">
            {PROVISIONS.map(function (o) {
              const value = data[o.field]
              return (
                <CashCard
                  key={o.field}
                  value={isNaN(value) ? value : formatNumberValue(value, 0, 0)}
                  {...o}
                />
              )
            })}
          </ul>
          <ul className="flex list-none flex-wrap gap-4 pl-0">
            {TOTAL.map(function (o) {
              const value = data[o.field]
              return (
                <CashCard
                  key={o.field}
                  value={isNaN(value) ? value : formatNumberValue(value, 0, 0)}
                  {...o}
                />
              )
            })}
          </ul>
        </div>

        <div className="w-5/12">
          <br className="m-5 leading-7" />
          <div className="flex flex-col gap-8">
            <div className="h-[562px] w-full rounded-lg bg-[#F5F5F5]"></div>
            <div className="h-[464px] w-full rounded-lg bg-[#F5F5F5]"></div>
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

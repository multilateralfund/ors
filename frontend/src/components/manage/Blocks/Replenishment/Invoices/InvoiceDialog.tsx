import { ApiReplenishmentSoAEntry } from '@ors/types/api_replenishment_scales_of_assessment'

import React, {
  ChangeEventHandler,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import cx from 'classnames'

import {
  DialogTabButtons,
  DialogTabContent,
} from '@ors/components/manage/Blocks/Replenishment/DialogTabs'
import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldDateInput,
  FieldFormattedNumberInput,
  FieldInput,
  FieldSearchableSelect,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'
import { InvoiceDialogProps } from '@ors/components/manage/Blocks/Replenishment/Invoices/types'
import { scAnnualOptions } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import useGetCountryReplenishmentInfo from '@ors/components/manage/Blocks/Replenishment/useGetCountryReplenishmentInfo'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { getFloat } from '@ors/helpers/Utils/Utils'

interface TabContentProps {
  data: InvoiceDialogProps['data']
  fields: InvoiceDialogFields
  updateField: (
    name: string,
  ) => ChangeEventHandler<HTMLInputElement | HTMLSelectElement>
}

interface TabContentDetailsProps extends TabContentProps {
  countries: InvoiceDialogProps['countries']
  countryInfo: ApiReplenishmentSoAEntry | null
  setFields: React.Dispatch<React.SetStateAction<InvoiceDialogFields>>
}

interface TabContentAmountProps extends TabContentProps {
  countryInfo: ApiReplenishmentSoAEntry | null
  setFields: React.Dispatch<React.SetStateAction<InvoiceDialogFields>>
}

function TabContentDetails(props: TabContentDetailsProps) {
  const { countries, countryInfo, data, fields, setFields, updateField } = props
  const ctx = useContext(ReplenishmentContext)
  const yearOptions = scAnnualOptions(ctx.periods)

  function handleCountrySelect(value: string) {
    setFields(function (prev) {
      return {
        ...prev,
        country_id: value,
        is_ferm: countryInfo?.opted_for_ferm || false,
      }
    })
  }

  const handleToggleFerm: ChangeEventHandler<HTMLInputElement> = (evt) => {
    setFields((prev) => ({
      ...prev,
      is_ferm: evt.target.checked,
    }))
  }

  return (
    <>
      <FieldSearchableSelect
        id="country_id"
        label="Country"
        value={fields.country_id}
        onChange={handleCountrySelect}
        required
      >
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name_alt}
          </option>
        ))}
      </FieldSearchableSelect>
      <FieldInput
        id="is_ferm"
        className="grow-0"
        checked={fields.is_ferm}
        label="Country opted for FERM"
        type="checkbox"
        onChange={handleToggleFerm}
      />
      <FieldInput
        id="number"
        defaultValue={data?.number}
        label="Invoice number"
        type="text"
        required
      />
      <FieldSelect
        id="year"
        label="Year"
        value={fields.year}
        onChange={updateField('year')}
        required
      >
        <option value="" disabled hidden></option>
        {yearOptions.map((year) => (
          <option key={year.value} className="text-primary" value={year.value}>
            {year.label}
          </option>
        ))}
      </FieldSelect>
      <FieldDateInput
        id="date_of_issuance"
        label="Invoice date"
        value={fields.date_of_issuance}
        onChange={updateField('date_of_issuance')}
        required
      />
      <FieldDateInput
        id="date_sent_out"
        label="Sent date"
        min={fields.date_of_issuance}
        value={fields.date_sent_out}
        onChange={updateField('date_sent_out')}
      />
      <FieldDateInput
        id="date_first_reminder"
        label="1st reminder date"
        min={fields.date_of_issuance}
        value={fields.date_first_reminder}
        onChange={updateField('date_first_reminder')}
      />
      <FieldDateInput
        id="date_second_reminder"
        label="2nd reminder date"
        min={fields.date_of_issuance}
        value={fields.date_second_reminder}
        onChange={updateField('date_second_reminder')}
      />
    </>
  )
}

function TabContentAmount(props: TabContentAmountProps) {
  const { countryInfo, data, fields, setFields, updateField } = props

  const handleChangeAmount: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const amount = evt.target.value
    const nrAmount = getFloat(amount)
    setFields((prev) => ({
      ...prev,
      amount,
      amount_local_currency: (
        nrAmount * (countryInfo?.exchange_rate || 1)
      ).toString(),
    }))
  }
  const handleChangeLocalCurrencyAmount: ChangeEventHandler<
    HTMLInputElement
  > = (evt) => {
    const amountLocal = evt.target.value
    const nrAmountLocal = getFloat(amountLocal)
    setFields((prev) => ({
      ...prev,
      amount: (nrAmountLocal / (countryInfo?.exchange_rate || 1)).toString(),
      amount_local_currency: amountLocal,
    }))
  }

  return (
    <>
      <div className="relative">
        <div className={cx({ 'blur-sm': !fields.country_id })}>
          <FieldInput
            id="currency"
            disabled={!fields.is_ferm}
            label="Currency"
            readOnly={!fields.is_ferm}
            type="text"
            value={fields.currency}
            onChange={updateField('currency')}
          />
          <FieldFormattedNumberInput
            id="amount_local_currency"
            decimalDigits={5}
            disabled={!fields.is_ferm}
            label={`"${fields.currency}" amount`}
            readOnly={!fields.is_ferm}
            value={fields.amount_local_currency}
            onChange={
              fields.is_ferm
                ? handleChangeLocalCurrencyAmount
                : updateField('amount_local_currency')
            }
          />
          <FieldFormattedNumberInput
            id="exchange_rate"
            disabled={!fields.is_ferm}
            label="Exchange rate"
            readOnly={!fields.is_ferm}
            step="any"
            value={fields.exchange_rate}
            onChange={updateField('exchange_rate')}
          />
          <FieldFormattedNumberInput
            id="amount"
            decimalDigits={5}
            label="USD amount"
            value={fields.amount}
            onChange={
              fields.is_ferm ? handleChangeAmount : updateField('amount')
            }
          />
        </div>
        {!fields.country_id && (
          <div className="absolute left-0 top-0 flex h-full w-full scale-110 items-center justify-center rounded-lg bg-gray-100 opacity-85">
            <span className="text-lg drop-shadow">
              {'Please select a country in the "Details" tab.'}
            </span>
          </div>
        )}
      </div>
      <h4>Upload</h4>
      <InvoiceAttachments oldFiles={data?.files_data} />
    </>
  )
}

interface InvoiceDialogFields {
  amount: string
  amount_local_currency: string
  country_id: string
  currency: string
  date_first_reminder: string
  date_of_issuance: string
  date_second_reminder: string
  date_sent_out: string
  exchange_rate: string
  is_ferm: boolean
  year: string
}

const InvoiceDialog = function InvoiceDialog(props: InvoiceDialogProps) {
  const { countries, data, isEdit, onSubmit, title, ...dialogProps } = props

  const [tab, setTab] = useState(0)

  const ctx = useContext(ReplenishmentContext)

  const [fields, setFields] = useState<InvoiceDialogFields>({
    amount: data?.amount?.toString() ?? '',
    amount_local_currency: data?.amount_local_currency?.toString() || '',
    country_id: data?.country_id?.toString() ?? '',
    currency: data?.currency?.toString() ?? '',
    date_first_reminder: data?.date_first_reminder?.toString() ?? '',
    date_of_issuance: data?.date_of_issuance?.toString() ?? '',
    date_second_reminder: data?.date_second_reminder?.toString() ?? '',
    date_sent_out: data?.date_sent_out?.toString() ?? '',
    exchange_rate: data?.exchange_rate?.toString() ?? '',
    is_ferm: data?.is_ferm ?? false,
    year: data?.year?.toString() ?? '',
  })

  const updateField = useCallback(
    (name: string) => {
      const handler: ChangeEventHandler<
        HTMLInputElement | HTMLSelectElement
      > = (evt) => setFields((prev) => ({ ...prev, [name]: evt.target.value }))
      return handler
    },
    [setFields],
  )

  const start_year =
    parseInt(fields.year, 10) || ctx.periods?.[0].start_year || 0

  const { getForYear } = useGetCountryReplenishmentInfo(fields.country_id)
  const {
    entry: countryInfo,
    matched: countryInfoMatched,
    period: countryInfoPeriod,
  } = useMemo(
    function () {
      return getForYear(start_year)
    },
    [getForYear, start_year],
  )

  useEffect(
    function () {
      if (!isEdit) {
        setFields((prev) => {
          const updated = {
            amount: (countryInfo?.amount || '').toString() || '',
            amount_local_currency:
              (countryInfo?.amount_local_currency || '').toString() || '',
            currency: (countryInfo?.currency || '').toString() || '',
            exchange_rate: (countryInfo?.exchange_rate || '').toString() || '',
            is_ferm: countryInfo?.opted_for_ferm || false,
          }

          return {
            ...prev,
            ...updated,
          }
        })
      }
    },
    [countryInfo, isEdit],
  )

  const handleFormSubmit: InvoiceDialogProps['onSubmit'] = (formData, evt) => {
    const fieldsKeys = Object.keys(fields) as (keyof InvoiceDialogFields)[]
    for (let i = 0; i < fieldsKeys.length; i++) {
      formData.set(fieldsKeys[i], fields[fieldsKeys[i]].toString())
    }

    onSubmit(formData, evt)
  }

  return (
    <FormDialog title={title} onSubmit={handleFormSubmit} {...dialogProps}>
      {isEdit && (
        <>
          <input name="id" defaultValue={data?.id} type="hidden" />
          <input
            name="replenishment_id"
            defaultValue={data?.replenishment?.id}
            type="hidden"
          />
        </>
      )}
      <DialogTabButtons
        current={tab}
        tabs={['Details', 'Amount']}
        onClick={setTab}
      />
      <DialogTabContent isCurrent={tab == 0}>
        <TabContentDetails
          countries={countries}
          countryInfo={countryInfo}
          data={data}
          fields={fields}
          setFields={setFields}
          updateField={updateField}
        />
      </DialogTabContent>
      <DialogTabContent isCurrent={tab == 1}>
        {countryInfo && !countryInfoMatched ? (
          <div className="text-center">
            No <span className="underline">final</span> data found for the
            selected year (<strong>{start_year}</strong>).
            <br />
            Using data from the <strong>{countryInfoPeriod}</strong> period
            instead.
          </div>
        ) : null}
        <TabContentAmount
          countryInfo={countryInfo}
          data={data}
          fields={fields}
          setFields={setFields}
          updateField={updateField}
        />
      </DialogTabContent>
    </FormDialog>
  )
}

export default InvoiceDialog

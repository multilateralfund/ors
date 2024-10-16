'use client'

import { ApiReplenishmentInvoice } from '@ors/types/api_replenishment_invoices'

import React, {
  ChangeEventHandler,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  DialogTabButtons,
  DialogTabContent,
} from '@ors/components/manage/Blocks/Replenishment/DialogTabs'
import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  Field,
  FieldDateInput,
  FieldFormattedNumberInput,
  FieldInput,
  FieldMultiSelect,
  FieldSearchableSelect,
  FieldSelect,
  FieldTextLine,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'
import useGetInvoices from '@ors/components/manage/Blocks/Replenishment/Invoices/useGetInvoices'
import { scAnnualOptions } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import useGetCountryReplenishmentInfo from '@ors/components/manage/Blocks/Replenishment/useGetCountryReplenishmentInfo'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { getFloat } from '@ors/helpers/Utils/Utils'

import { IPaymentDialogProps } from './types'

interface PaymentDialogFields {
  amount: string
  amount_local_currency: string
  country_id: string
  currency: string
  exchange_rate: string
  ferm_gain_or_loss: string
  invoices: string[]
  is_ferm: boolean
  payment_for_years: string[]
  status: string
}

function getInvoiceLabel(invoice: ApiReplenishmentInvoice) {
  return `${invoice.number} - ${invoice?.country?.name} (${invoice?.date_of_issuance})`
}

const PaymentDialog = function PaymentDialog(props: IPaymentDialogProps) {
  const { columns, countries, data, isEdit, onSubmit, title, ...dialogProps } =
    props

  const [date, setDate] = useState(data?.date ?? '')

  const [tab, setTab] = useState(0)

  const ctx = useContext(ReplenishmentContext)

  const [fields, setFields] = useState<PaymentDialogFields>({
    amount: data?.amount?.toString() ?? '',
    amount_local_currency: data?.amount_local_currency?.toString() ?? '',
    country_id: data?.country_id?.toString() ?? '',
    currency: data?.currency?.toString() ?? '',
    exchange_rate: data?.exchange_rate?.toString() ?? '',
    ferm_gain_or_loss: data?.ferm_gain_or_loss?.toString() ?? '',
    invoices: data?.invoices?.map((o) => o.id.toString()) ?? [],
    is_ferm: data?.is_ferm ?? false,
    payment_for_years: data?.payment_for_years?.map((o) => o.toString()) ?? [],
    status: data?.status?.toString() ?? '',
  })

  const yearOptions = scAnnualOptions(ctx.periods)

  function setField(name: keyof PaymentDialogFields) {
    return function (value: PaymentDialogFields[typeof name]) {
      setFields((prev) => ({ ...prev, [name]: value }))
    }
  }

  const updateField = useCallback((name: keyof PaymentDialogFields) => {
    const handler: React.ChangeEventHandler<
      HTMLInputElement | HTMLSelectElement
    > = (evt) => setField(name)(evt.target.value)
    return handler
  }, [])

  const {
    loading: invoicesLoading,
    results: invoicesList,
    setParams: setGetInvoicesParams,
  } = useGetInvoices({
    country_id: fields.country_id,
  })

  const hasInvoices = useMemo(
    function () {
      return fields.country_id && invoicesList.length > 0 && !invoicesLoading
    },
    [fields.country_id, invoicesList, invoicesLoading],
  )

  const invoicedAmount = useMemo(
    function () {
      let total = 0
      for (let i = 0; i < invoicesList.length; i++) {
        if (fields.invoices.includes(invoicesList[i].id.toString())) {
          total += invoicesList[i].amount
        }
      }
      return total
    },
    [invoicesList, fields.invoices],
  )

  const paymentForYear = useMemo(
    () =>
      fields.payment_for_years.length > 0
        ? fields.payment_for_years[0] !== 'arrears'
          ? parseInt(fields.payment_for_years[0], 10) ||
            ctx.periods?.[0].start_year
          : ctx.periods?.[0].start_year
        : ctx.periods?.[0].start_year,
    [ctx.periods, fields.payment_for_years],
  )

  const { getForYear } = useGetCountryReplenishmentInfo(fields.country_id)
  const {
    entry: countryInfo,
    matched: countryInfoMatched,
    period: countryInfoPeriod,
  } = useMemo(
    function () {
      return getForYear(paymentForYear)
    },
    [getForYear, paymentForYear],
  )

  useEffect(
    function () {
      if (!isEdit) {
        setFields((prev) => {
          const updated = {
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
      } else {
        setFields((prev) => {
          const updated = {
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

  const handleFormSubmit: IPaymentDialogProps['onSubmit'] = (formData, evt) => {
    formData.set('date', date)
    onSubmit(formData, evt)
  }

  const handleChangeAmount: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const amount = evt.target.value
    const nrAmount = getFloat(amount) || 1
    setFields((prev) => ({
      ...prev,
      amount,
      exchange_rate: (
        getFloat(fields.amount_local_currency) / nrAmount
      ).toString(),
    }))
  }

  const handleChangeCurrencyAmount: ChangeEventHandler<HTMLInputElement> = (
    evt,
  ) => {
    const currencyAmount = evt.target.value
    const nrCurrencyAmount = getFloat(currencyAmount) || 0
    setFields((prev) => ({
      ...prev,
      amount_local_currency: currencyAmount,
      exchange_rate: (
        getFloat(nrCurrencyAmount) / getFloat(fields.amount)
      ).toString(),
    }))
  }

  function handleChangeCountry(value: string) {
    setFields(function (prev) {
      return {
        ...prev,
        country_id: value,
        is_ferm: countryInfo?.opted_for_ferm || false,
      }
    })
    setGetInvoicesParams({ country_id: value })
  }

  const handleToggleFerm: ChangeEventHandler<HTMLInputElement> = (evt) => {
    setFields((prev) => ({
      ...prev,
      is_ferm: evt.target.checked,
    }))
  }

  function handleChangeInvoices(value: string) {
    setFields(function (prev) {
      return { ...prev, invoices: [value] }
    })
  }

  function handleChangeYears(value: string) {
    setFields(function (prev) {
      return { ...prev, payment_for_years: [value] }
    })
  }

  useEffect(
    function () {
      const arrears_or_deferred =
        fields.payment_for_years.includes('arrears') ||
        fields.payment_for_years.includes('Arrears') ||
        fields.payment_for_years.includes('deferred') ||
        fields.payment_for_years.includes('Deferred')
      if (fields.invoices.length > 0 && arrears_or_deferred) {
        setFields(function (prev) {
          return {
            ...prev,
            ferm_gain_or_loss: (
              invoicedAmount - getFloat(fields.amount)
            ).toString(),
          }
        })
      }
    },
    [invoicedAmount, fields.amount, fields.invoices, fields.payment_for_years],
  )

  return (
    <FormDialog title={title} onSubmit={handleFormSubmit} {...dialogProps}>
      {isEdit && <input name="id" defaultValue={data?.id} type="hidden" />}
      <DialogTabButtons
        current={tab}
        tabs={['Details', 'Amount']}
        onClick={setTab}
      />
      <DialogTabContent isCurrent={tab == 0}>
        <FieldSearchableSelect
          id="country_id"
          defaultValue={data?.country_id.toString()}
          label={columns.country.label}
          onChange={handleChangeCountry}
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
        {hasInvoices ? (
          <FieldSearchableSelect
            id="invoices"
            defaultValue={fields.invoices?.[0] ?? ''}
            hasClear={true}
            label={columns.invoice_numbers.label}
            required={true}
            onChange={handleChangeInvoices}
          >
            {invoicesList.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {getInvoiceLabel(inv)}
              </option>
            ))}
          </FieldSearchableSelect>
        ) : (
          <FieldTextLine
            label={columns.invoice_numbers.label}
            text={'No invoices found for this country'}
          />
        )}
        <FieldSearchableSelect
          id="payment_for_years"
          defaultValue={fields.payment_for_years?.[0] ?? ''}
          hasClear={true}
          label={columns.payment_years.label}
          required={true}
          onChange={handleChangeYears}
        >
          <option key="arrears" className="text-primary" value="arrears">
            Arrears
          </option>
          {/*<option key="deferred" className="text-primary" value="deferred">*/}
          {/*  Deferred*/}
          {/*</option>*/}
          {yearOptions.map((year) => (
            <option
              key={year.value}
              className="text-primary"
              value={year.value}
            >
              {year.label}
            </option>
          ))}
        </FieldSearchableSelect>
        <FieldSearchableSelect
          id="status"
          defaultValue={fields.status}
          hasClear={true}
          label="Status"
          onChange={setField('status')}
          onClear={() => setField('status')('')}
          required
        >
          <option value="paid">Paid</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="pending">Pending</option>
        </FieldSearchableSelect>
        <FieldDateInput
          id="date"
          label={columns.date.label}
          value={date}
          onChange={(evt) => setDate(evt.target.value)}
          required
        />
        <FieldInput
          id="comment"
          defaultValue={data?.comment || ''}
          label={columns.comment.label}
          type="text-area"
        />
      </DialogTabContent>
      <DialogTabContent isCurrent={tab == 1}>
        {countryInfo && !countryInfoMatched ? (
          <div className="text-center">
            No <span className="underline">final</span> data found for the
            selected year (<strong>{paymentForYear}</strong>).
            <br />
            Using data from the <strong>{countryInfoPeriod}</strong> period
            instead.
          </div>
        ) : null}
        <FieldInput
          id="currency"
          disabled={!fields.is_ferm}
          label={columns.currency.label}
          readOnly={!fields.is_ferm}
          type="text"
          value={fields.is_ferm ? fields.currency : 'USD'}
          onChange={updateField('currency')}
          required
        />
        <FieldFormattedNumberInput
          id="amount_local_currency"
          decimalDigits={5}
          disabled={!fields.is_ferm}
          readOnly={!fields.is_ferm}
          value={fields.amount_local_currency}
          label={
            fields.currency
              ? `"${fields.currency}" amount`
              : 'Local currency amount'
          }
          onChange={
            fields.is_ferm
              ? handleChangeCurrencyAmount
              : updateField('amount_local_currency')
          }
        />
        <FieldFormattedNumberInput
          id="exchange_rate"
          disabled={!fields.is_ferm}
          label={columns.exchange_rate.label}
          readOnly={!fields.is_ferm}
          value={fields.is_ferm ? fields.exchange_rate : ''}
          onChange={updateField('exchange_rate')}
        />
        <FieldFormattedNumberInput
          id="amount"
          decimalDigits={5}
          label="USD amount"
          value={fields.amount}
          onChange={fields.is_ferm ? handleChangeAmount : updateField('amount')}
          required
        />
        <FieldFormattedNumberInput
          id="ferm_gain_or_loss"
          disabled={!fields.is_ferm}
          label={columns.ferm_gain_or_loss.label}
          readOnly={!fields.is_ferm}
          value={fields.is_ferm ? fields.ferm_gain_or_loss : ''}
          onChange={updateField('ferm_gain_or_loss')}
        />
        <h5>Upload</h5>
        <InvoiceAttachments
          oldFiles={data?.files_data || []}
          withFileType={false}
        />
      </DialogTabContent>
    </FormDialog>
  )
}

export default PaymentDialog

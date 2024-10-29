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

import Big from 'big.js'

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
  FieldTextLine,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'
import useGetInvoices from '@ors/components/manage/Blocks/Replenishment/Invoices/useGetInvoices'
import { scAnnualOptions } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import useGetCountryReplenishmentInfo from '@ors/components/manage/Blocks/Replenishment/useGetCountryReplenishmentInfo'
import { asDecimal } from '@ors/components/manage/Blocks/Replenishment/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

import { IPaymentDialogProps } from './types'

interface PaymentDialogFields {
  amount_assessed: string
  amount_local_currency: string
  amount_received: string
  country_id: string
  currency: string
  exchange_rate: string
  ferm_gain_or_loss: string
  invoice: string
  is_ferm: boolean
  payment_for_years: string[]
  status: string
}

function getInvoiceLabel(invoice: ApiReplenishmentInvoice) {
  return `${invoice.number} (${invoice?.date_of_issuance})`
}

function assessAmountFromCurrency(
  currencyAmount: string,
  exchangeRate: string,
): string {
  const am = asDecimal(currencyAmount) || new Big('0')
  const er = asDecimal(exchangeRate) || new Big('1')
  return am.div(er).toString()
}

const PaymentDialog = function PaymentDialog(props: IPaymentDialogProps) {
  const { columns, countries, data, isEdit, onSubmit, title, ...dialogProps } =
    props

  const [date, setDate] = useState(data?.date ?? '')

  const [tab, setTab] = useState(0)

  const ctx = useContext(ReplenishmentContext)

  const [fields, setFields] = useState<PaymentDialogFields>({
    amount_assessed: data?.amount_assessed?.toString() ?? '',
    amount_local_currency: data?.amount_local_currency?.toString() ?? '',
    amount_received: data?.amount_received?.toString() ?? '',
    country_id: data?.country_id?.toString() ?? '',
    currency: data?.currency?.toString() ?? '',
    exchange_rate: data?.exchange_rate?.toString() ?? '',
    ferm_gain_or_loss: data?.ferm_gain_or_loss?.toString() ?? '',
    invoice: data?.invoice?.id.toString() ?? '',
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

  const paymentForYear = useMemo(
    () =>
      fields.payment_for_years.length > 0
        ? parseInt(fields.payment_for_years[0], 10) ||
          ctx.periods?.[0].start_year
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
      const optedForFerm = countryInfo?.opted_for_ferm || false

      if (!isEdit) {
        const amountLocalCurrency = optedForFerm
          ? (countryInfo?.yearly_amount_local_currency || '').toString() || ''
          : (countryInfo?.yearly_amount || '').toString() || ''
        const exchangeRate = (countryInfo?.exchange_rate || '').toString() || ''

        setFields((prev) => {
          const updated = {
            amount_assessed: assessAmountFromCurrency(
              amountLocalCurrency,
              exchangeRate,
            ),
            amount_local_currency: amountLocalCurrency,
            currency: optedForFerm
              ? (countryInfo?.currency || '').toString() || ''
              : 'USD',
            exchange_rate: exchangeRate,
            is_ferm: optedForFerm,
          }

          return {
            ...prev,
            ...updated,
          }
        })
      } else {
        setFields((prev) => {
          const updated = {
            is_ferm: optedForFerm,
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

  const handleSelectInvoice = useCallback(
    function handleSelectInvoice(invoiceId: string) {
      const invoice = invoicesList.find(({ id }) => id.toString() === invoiceId)
      setFields(function (prevState): PaymentDialogFields {
        return {
          ...prevState,
          get amount_assessed() {
            return this.is_ferm
              ? assessAmountFromCurrency(
                  this.amount_local_currency,
                  this.exchange_rate,
                )
              : ''
          },
          amount_local_currency:
            invoice?.amount_local_currency?.toString() ?? '',
          amount_received: invoice?.amount_usd?.toString() ?? '',
          invoice: invoiceId,
          is_ferm: invoice?.is_ferm ?? prevState.is_ferm,
          payment_for_years: invoice ? [invoice?.year.toString()] : [],
        }
      })
    },
    [invoicesList],
  )

  const handleChangeCurrencyAmount: ChangeEventHandler<HTMLInputElement> = (
    evt,
  ) => {
    const currencyAmount = evt.target.value
    setFields((prev) => ({
      ...prev,
      amount_assessed: assessAmountFromCurrency(
        currencyAmount,
        fields.exchange_rate,
      ),
      amount_local_currency: currencyAmount,
    }))
  }

  function handleChangeCountry(value: string) {
    setFields(function (prev) {
      return {
        ...prev,
        country_id: value,
        invoice: '',
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

  function handleChangeYears(value: string) {
    setFields(function (prev) {
      return { ...prev, payment_for_years: [value] }
    })
  }

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
          label={columns.country.label}
          value={fields.country_id}
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
            id="invoice_id"
            hasClear={true}
            label={columns.invoice_number.label}
            required={true}
            value={fields.invoice ?? ''}
            onChange={handleSelectInvoice}
          >
            {invoicesList.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {getInvoiceLabel(inv)}
              </option>
            ))}
          </FieldSearchableSelect>
        ) : (
          <FieldTextLine
            label={columns.invoice_number.label}
            text={'No invoices found for this country'}
          />
        )}
        <FieldSearchableSelect
          id="payment_for_years"
          hasClear={true}
          label={columns.payment_years.label}
          required={true}
          value={fields.payment_for_years?.[0] ?? ''}
          onChange={handleChangeYears}
        >
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
          value={fields.is_ferm ? fields.amount_local_currency : ''}
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
          id="amount_received"
          decimalDigits={5}
          label="USD amount received"
          value={fields.amount_received}
          onChange={updateField('amount_received')}
          required
        />
        <FieldFormattedNumberInput
          id="amount_assessed"
          decimalDigits={5}
          label="USD amount assessed"
          value={fields.amount_assessed}
          onChange={updateField('amount_assessed')}
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
        <FieldSearchableSelect
          id="status"
          hasClear={true}
          label="Status"
          value={fields.status}
          onChange={setField('status')}
          required
        >
          <option value="paid">Paid</option>
          <option value="partially_paid">Partially Paid</option>
        </FieldSearchableSelect>
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

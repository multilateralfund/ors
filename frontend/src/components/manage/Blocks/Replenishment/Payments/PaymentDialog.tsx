'use client'

import {
  ApiReplenishmentInvoice,
} from '@ors/types/api_replenishment_invoices'

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
  })

  const yearOptions = scAnnualOptions(ctx.periods)

  const updateField = useCallback(
    (name: string) => {
      const handler: React.ChangeEventHandler<
        HTMLInputElement | HTMLSelectElement
      > = (evt) => setFields((prev) => ({ ...prev, [name]: evt.target.value }))
      return handler
    },
    [setFields],
  )

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

  const [countryInfo] = useGetCountryReplenishmentInfo(
    ctx.periods?.[0].start_year || '',
    fields.country_id,
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
    const nrAmount = getFloat(amount)
    setFields((prev) => ({
      ...prev,
      amount,
      amount_local_currency: (
        nrAmount * (countryInfo?.exchange_rate || 1)
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

  function handleChangeInvoices(value: string[]) {
    setFields(function (prev) {
      return { ...prev, invoices: value }
    })
  }

  function handleChangeYears(value: string[]) {
    setFields(function (prev) {
      return { ...prev, payment_for_years: value }
    })
  }

  useEffect(
    function () {
      const arrears_or_deferred = (
        fields.payment_for_years.includes('arrears')
        || fields.payment_for_years.includes('Arrears')
        || fields.payment_for_years.includes('deferred')
        || fields.payment_for_years.includes('Deferred')
      )
      if (
        fields.invoices.length > 0
        && arrears_or_deferred
      ) {
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
          checked={fields.is_ferm}
          label="Country opted for FERM"
          type="checkbox"
          onChange={handleToggleFerm}
        />
        {hasInvoices ? (
          <FieldMultiSelect
            id="invoices"
            defaultValue={fields.invoices}
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
          </FieldMultiSelect>
        ) : (
          <Field id="no_invoices" label={columns.invoice_numbers.label}>
            <span id="no_invoices" className="ml-4">
              No invoices found for this country
            </span>
          </Field>
        )}
        <FieldMultiSelect
          id="payment_for_years"
          defaultValue={fields.payment_for_years}
          hasClear={true}
          label={columns.payment_years.label}
          required={true}
          onChange={handleChangeYears}
        >
          <option key="arrears" className="text-primary" value="arrears">
            Arrears
          </option>
          <option key="arrears" className="text-primary" value="deferred">
            Deferred
          </option>
          {yearOptions.map((year) => (
            <option key={year.value} className="text-primary" value={year.value}>
              {year.label}
            </option>
          ))}
        </FieldMultiSelect>
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
          label={`"${fields.currency}" amount`}
          readOnly={!fields.is_ferm}
          value={fields.amount_local_currency}
          onChange={updateField('amount_local_currency')}
        />
        <FieldFormattedNumberInput
          id="exchange_rate"
          disabled={!fields.is_ferm}
          label={columns.exchange_rate.label}
          readOnly={!fields.is_ferm}
          value={fields.is_ferm ? fields.exchange_rate: ''}
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

'use client'

import { ApiReplenishmentInvoices } from '@ors/types/api_replenishment_invoices'

import React, {
  ChangeEventHandler,
  useCallback,
  useContext,
  useEffect,
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
import useGetCountryReplenishmentInfo from '@ors/components/manage/Blocks/Replenishment/useGetCountryReplenishmentInfo'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { formatApiUrl } from '@ors/helpers'
import { getFloat } from '@ors/helpers/Utils/Utils'

import { IPaymentDialogProps } from './types'

const BASE_URL = 'api/replenishment/invoices/'

interface PaymentDialogFields {
  amount: string
  amount_local_currency: string
  currency: string
  exchange_rate: string
  ferm_gain_or_loss: string
}

const PaymentDialog = function PaymentDialog(props: IPaymentDialogProps) {
  const { columns, countries, data, isEdit, onSubmit, title, ...dialogProps } =
    props
  const [selectedCountry, setSelectedCountry] = useState<null | string>(null)
  const [invoicesOptions, setInvoicesOptions] = useState<
    { id: number; label: string }[]
  >([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)

  const [date, setDate] = useState(data?.date ?? '')

  const [tab, setTab] = useState(0)

  const ctx = useContext(ReplenishmentContext)

  const [fields, setFields] = useState<PaymentDialogFields>({
    amount: data?.amount?.toString() ?? '',
    amount_local_currency: data?.amount_local_currency?.toString() ?? '',
    currency: data?.currency?.toString() ?? '',
    exchange_rate: data?.exchange_rate?.toString() ?? '',
    ferm_gain_or_loss: data?.ferm_gain_or_loss?.toString() ?? '',
  })

  const updateField = useCallback(
    (name: string) => {
      const handler: React.ChangeEventHandler<
        HTMLInputElement | HTMLSelectElement
      > = (evt) => setFields((prev) => ({ ...prev, [name]: evt.target.value }))
      return handler
    },
    [setFields],
  )

  const [countryInfo] = useGetCountryReplenishmentInfo(
    ctx.periods?.[0].start_year || '',
    selectedCountry ?? '',
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

  useEffect(() => {
    setInvoicesLoading(true)

    const countryQuery = selectedCountry ? `&country_id=${selectedCountry}` : ''
    const url = `${formatApiUrl(BASE_URL)}?hide_no_invoice=true${countryQuery}`

    fetch(url, {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((invoicesList: ApiReplenishmentInvoices) => {
        const invoices = invoicesList.map((invoice) => ({
          id: invoice.id,
          label: `${invoice.number} - ${invoice?.country?.name} (${invoice?.date_of_issuance})`,
        }))

        setInvoicesOptions(invoices)
        setInvoicesLoading(false)
      })
      .catch((error) => {
        console.error('Error: ', error)
        setInvoicesOptions([])
        setInvoicesLoading(false)
      })
  }, [selectedCountry])

  const handleFormSubmit: IPaymentDialogProps['onSubmit'] = (formData, evt) => {
    formData.set('date', date)
    onSubmit(formData, evt)
  }

  const isFERM = countryInfo?.opted_for_ferm || false
  const fieldsAreReadonly = countryInfo ? !isFERM : false

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
          onChange={setSelectedCountry}
          required
        >
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_alt}
            </option>
          ))}
        </FieldSearchableSelect>
        {!invoicesLoading && invoicesOptions.length === 0 ? (
          <Field id="no_invoices" label={columns.invoice_numbers.label}>
            <span id="no_invoices" className="ml-4">
              No invoices found for this country
            </span>
          </Field>
        ) : (
          <FieldMultiSelect
            id="invoices"
            defaultValue={data?.invoices?.map((o) => o.id.toString())}
            hasClear={true}
            label={columns.invoice_numbers.label}
            required={true}
          >
            {invoicesOptions.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.label}
              </option>
            ))}
          </FieldMultiSelect>
        )}
        <FieldInput
          id="payment_for_year"
          defaultValue={data?.payment_for_year}
          label={columns.payment_for_year.label}
          type="text"
          required
        />
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
          disabled={fieldsAreReadonly}
          label={columns.currency.label}
          readOnly={fieldsAreReadonly}
          type="text"
          value={fields.currency}
          onChange={updateField('currency')}
          required
        />
        <FieldFormattedNumberInput
          id="amount_local_currency"
          decimalDigits={5}
          disabled={fieldsAreReadonly}
          label={`"${fields.currency}" amount`}
          readOnly={fieldsAreReadonly}
          value={fields.amount_local_currency}
          onChange={updateField('amount_local_currency')}
        />
        <FieldFormattedNumberInput
          id="exchange_rate"
          disabled={fieldsAreReadonly}
          label={columns.exchange_rate.label}
          readOnly={fieldsAreReadonly}
          value={fields.exchange_rate}
          onChange={updateField('exchange_rate')}
        />
        <FieldFormattedNumberInput
          id="amount"
          decimalDigits={5}
          label="USD amount"
          value={fields.amount}
          onChange={isFERM ? handleChangeAmount : updateField('amount')}
          required
        />
        <FieldFormattedNumberInput
          id="ferm_gain_or_loss"
          disabled={fieldsAreReadonly}
          label={columns.ferm_gain_or_loss.label}
          readOnly={fieldsAreReadonly}
          value={fields.ferm_gain_or_loss}
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

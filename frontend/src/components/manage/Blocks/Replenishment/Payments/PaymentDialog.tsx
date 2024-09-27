'use client'

import { ApiReplenishmentInvoices } from '@ors/types/api_replenishment_invoices'

import React, { useEffect, useState } from 'react'

import {
  DialogTabButtons,
  DialogTabContent,
} from '@ors/components/manage/Blocks/Replenishment/DialogTabs'
import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  Field,
  FieldDateInput,
  FieldInput,
  FieldMultiSelect,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'
import { formatApiUrl } from '@ors/helpers'

import { IPaymentDialogProps } from './types'

const BASE_URL = 'api/replenishment/invoices/'

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
    formData.delete('date_mask')
    onSubmit(formData, evt)
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
        <FieldSelect
          id="country_id"
          defaultValue={data?.country_id.toString()}
          label={columns.country.label}
          onChange={(event) => {
            setSelectedCountry(event.target.value)
          }}
          required
        >
          <option value="" disabled hidden></option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_alt}
            </option>
          ))}
        </FieldSelect>
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
          defaultValue={data?.currency}
          label={columns.currency.label}
          type="text"
          required
        />
        <FieldInput
          id="amount"
          defaultValue={data?.amount?.toString()}
          label={columns.amount.label}
          step="any"
          type="number"
          required
        />
        <FieldInput
          id="exchange_rate"
          defaultValue={data?.exchange_rate?.toString()}
          label={columns.exchange_rate.label}
          step="any"
          type="number"
        />
        <FieldInput
          id="ferm_gain_or_loss"
          defaultValue={data?.ferm_gain_or_loss}
          label={columns.ferm_gain_or_loss.label}
          step="any"
          type="number"
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

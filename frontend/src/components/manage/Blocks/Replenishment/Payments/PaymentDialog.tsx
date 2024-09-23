'use client'

import { ApiReplenishmentInvoices } from '@ors/types/api_replenishment_invoices'

import React, { useEffect, useState } from 'react'

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
      <FieldSelect
        id="country_id"
        defaultValue={data?.country_id.toString()}
        label={columns[0].label}
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
        <Field id="no_invoices" label="Invoices">
          <span id="no_invoices" className="ml-4">
            No invoices found for this country
          </span>
        </Field>
      ) : (
        <FieldMultiSelect
          id="invoices"
          defaultValue={data?.invoices?.map((o) => o.id.toString())}
          hasClear={true}
          label="Invoices"
          required={true}
        >
          {invoicesOptions.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.label}
            </option>
          ))}
        </FieldMultiSelect>
      )}
      <FieldDateInput
        id="date"
        label={columns[1].label}
        value={date}
        onChange={(evt) => setDate(evt.target.value)}
        required
      />
      <FieldInput
        id="payment_for_year"
        defaultValue={data?.payment_for_year}
        label={columns[5].label}
        type="text"
        required
      />
      <FieldInput
        id="amount"
        defaultValue={data?.amount?.toString()}
        label={columns[2].label}
        step="any"
        type="number"
        required
      />
      <FieldInput
        id="currency"
        defaultValue={data?.currency}
        label={columns[3].label}
        type="text"
        required
      />
      <FieldInput
        id="exchange_rate"
        defaultValue={data?.exchange_rate?.toString()}
        label={columns[4].label}
        step="any"
        type="number"
      />
      <FieldInput
        id="ferm_gain_or_loss"
        defaultValue={data?.ferm_gain_or_loss}
        label={columns[6].label}
        step="any"
        type="number"
      />
      <FieldInput
        id="comment"
        defaultValue={data?.comment || ''}
        label={columns[8].label}
        type="text-area"
      />
      <h5>Files</h5>
      <InvoiceAttachments
        oldFiles={data?.files_data || []}
        withFileType={false}
      />
    </FormDialog>
  )
}

export default PaymentDialog

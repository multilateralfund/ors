import React, { useState } from 'react'

import { Autocomplete, TextField } from '@mui/material'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'
import useApi from '@ors/hooks/useApi'

const PaymentDialog = function PaymentDialog(props) {
  const { columns, countries, data, isEdit, title, ...dialogProps } = props
  const [invoices, setInvoices] = useState([])
  const { data: invoicesList, loaded: invoicesLoaded } = useApi({
    options: {
      params: {
        hide_no_invoice: true,
        ...(isEdit ? { country_id: data?.country_id } : {}),
      },
      withStoreCache: false,
    },
    path: 'api/replenishment/invoices/',
  })

  const invoicesOptions = invoicesLoaded ? invoicesList.map((invoice) => ({
    id: invoice.id,
    label: invoice.number,
  })) : []

  return (
    <FormDialog title={title} {...dialogProps}>
      {isEdit && <input name="id" defaultValue={data?.id} type="hidden" />}
      <FieldSelect
        id="country_id"
        defaultValue={data?.country_id}
        label={columns[0].label}
        required
      >
        <option value="" disabled hidden></option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name_alt}
          </option>
        ))}
      </FieldSelect>
      {invoicesLoaded && (
        <div>
          <Autocomplete
            getOptionLabel={(option) => option.label}
            options={invoicesOptions}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" />
            )}
            multiple
          />
        </div>
      )}
      <FieldInput
        id="date"
        defaultValue={data?.date}
        label={columns[1].label}
        type="date"
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
        defaultValue={data?.amount}
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
        defaultValue={data?.exchange_rate}
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
      <InvoiceAttachments oldFiles={data?.files_data} withFileType={false} />
    </FormDialog>
  )
}

export default PaymentDialog

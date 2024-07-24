import React, { useContext } from 'react'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

const PaymentDialog = function PaymentDialog(props) {
  const { columns, countries, data, isEdit, title, ...dialogProps } = props
  // const ctx = useContext(ReplenishmentContext)

  return (
    <FormDialog title={title} {...dialogProps}>
      {isEdit && (
        <>
          <input name="id" defaultValue={data?.id} type="hidden" />
          <input
            name="replenishment_id"
            defaultValue={data?.replenishment.id}
            type="hidden"
          />
        </>
      )}
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
      <FieldInput
        id="date"
        defaultValue={data?.date}
        label={columns[1].label}
        type="date"
        required
      />
      <FieldInput
        id="amount"
        defaultValue={data?.amount}
        label={columns[2].label}
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
        step="0.001"
        type="number"
      />
      <FieldInput
        id="payment_for_year"
        defaultValue={data?.payment_for_year}
        label={columns[5].label}
        type="text"
        required
      />
      <FieldInput
        id="ferm_gain_or_loss"
        defaultValue={data?.ferm_gain_or_loss}
        label={columns[6].label}
        type="number"
      />
      <FieldInput
        id="comment"
        defaultValue={data?.comment}
        label={columns[8].label}
        type="text-area"
      />
      <h5>Files</h5>
      <InvoiceAttachments withFileType={false} />
    </FormDialog>
  )
}

export default PaymentDialog

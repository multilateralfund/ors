import React, { useContext } from 'react'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

const InvoiceDialog = function InvoiceDialog(props) {
  const { columns, countries, data, isEdit, title, ...dialogProps } = props
  const ctx = useContext(ReplenishmentContext)

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
        id="number"
        defaultValue={data?.number}
        label={columns[1].label}
        type="text"
        required
      />
      <FieldSelect
        id="period"
        label="Period"
        defaultValue={
          data &&
          `${data?.replenishment.start_year}-${data?.replenishment.end_year}`
        }
        required
      >
        <option value="" disabled hidden></option>
        {ctx.periodOptions.map((period) => (
          <option
            key={period.value}
            className="text-primary"
            value={period.value}
          >
            {period.label}
          </option>
        ))}
      </FieldSelect>
      <FieldInput
        id="date_of_issuance"
        defaultValue={data?.date_of_issuance}
        label={columns[2].label}
        type="date"
        required
      />
      <FieldInput
        id="amount"
        defaultValue={data?.amount}
        label={columns[3].label}
        type="number"
        required
      />
      <FieldInput
        id="currency"
        defaultValue={data?.currency}
        label={columns[4].label}
        type="text"
        required
      />
      <FieldInput
        id="exchange_rate"
        defaultValue={data?.exchange_rate}
        label={columns[5].label}
        step="0.001"
        type="number"
        required
      />
      <FieldInput
        id="date_sent_out"
        defaultValue={data?.date_sent_out}
        label="Sent out"
        type="date"
        required
      />
      <FieldInput
        id="reminder"
        defaultValue={data?.reminder}
        label="Reminder"
        type="date"
      />
      <h4>Files</h4>
      <InvoiceAttachments oldFiles={data?.files_data} />
    </FormDialog>
  )
}

export default InvoiceDialog

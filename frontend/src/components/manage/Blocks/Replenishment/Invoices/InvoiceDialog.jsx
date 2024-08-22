import React, { useContext } from 'react'

import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { useStore } from '@ors/store'

const InvoiceDialog = function InvoiceDialog(props) {
  const { countries, data, isEdit, title, ...dialogProps } = props
  const ctx = useContext(ReplenishmentContext)

  const settings = useStore((state) => state.common.settings.data)

  const yearOptions = []
  for (
    let i = settings.cp_reports.min_year;
    i <= settings.cp_reports.max_year + 1;
    i++
  ) {
    yearOptions.push({ id: i, label: i.toString(), value: i })
  }
  const reversedYearOptions = [...yearOptions].reverse()

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
        label="Country"
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
        label="Invoice number"
        type="text"
        required
      />
      <FieldSelect
        id="year"
        defaultValue={data?.year}
        label="Year"
        type="number"
        required
      >
        <option value="" disabled hidden></option>
        {reversedYearOptions.map((year) => (
          <option
            key={year.value}
            className="text-primary"
            value={year.value}
          >
            {year.label}
          </option>
        ))}
      </FieldSelect>
      <FieldInput
        id="date_of_issuance"
        defaultValue={data?.date_of_issuance}
        label="Date of issuance"
        type="date"
        required
      />
      <FieldInput
        id="amount"
        defaultValue={data?.amount}
        label="Amount"
        step="any"
        type="number"
        required
      />
      <FieldInput
        id="currency"
        defaultValue={data?.currency}
        label="Currency"
        type="text"
        required
      />
      <FieldInput
        id="exchange_rate"
        defaultValue={data?.exchange_rate}
        label="Exchange rate"
        step="any"
        type="number"
      />
      <FieldInput
        id="date_sent_out"
        defaultValue={data?.date_sent_out}
        label="Sent out"
        type="date"
      />
      <FieldInput
        id="date_first_reminder"
        defaultValue={data?.date_first_reminder}
        label="First reminder"
        type="date"
      />
      <FieldInput
        id="date_second_reminder"
        defaultValue={data?.date_second_reminder}
        label="Second reminder"
        type="date"
      />
      <h4>Files</h4>
      <InvoiceAttachments oldFiles={data?.files_data} />
    </FormDialog>
  )
}

export default InvoiceDialog

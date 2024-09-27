import React, {
  ChangeEventHandler,
  useCallback,
  useContext,
  useState,
} from 'react'

import {
  DialogTabButtons,
  DialogTabContent,
} from '@ors/components/manage/Blocks/Replenishment/DialogTabs'
import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldDateInput,
  FieldFormattedNumberInput,
  FieldInput,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'
import { scAnnualOptions } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

import { InvoiceDialogProps } from './types'

const InvoiceDialog = function InvoiceDialog(props: InvoiceDialogProps) {
  const { countries, data, isEdit, onSubmit, title, ...dialogProps } = props
  const ctx = useContext(ReplenishmentContext)

  const [tab, setTab] = useState(0)

  const yearOptions = scAnnualOptions(ctx.periods)
  const [fields, setFields] = useState({
    amount: data?.amount ?? '',
    date_first_reminder: data?.date_first_reminder ?? '',
    date_of_issuance: data?.date_of_issuance ?? '',
    date_second_reminder: data?.date_second_reminder ?? '',
    date_sent_out: data?.date_sent_out ?? '',
    exchange_rate: data?.exchange_rate ?? '',
  })

  const updateField = useCallback(
    (name: string) => {
      const handler: ChangeEventHandler<HTMLInputElement> = (evt) =>
        setFields((prev) => ({ ...prev, [name]: evt.target.value }))
      return handler
    },
    [setFields],
  )

  const handleFormSubmit: InvoiceDialogProps['onSubmit'] = (formData, evt) => {
    formData.set('date_of_issuance', fields.date_of_issuance)
    formData.set('date_first_reminder', fields.date_first_reminder)
    formData.set('date_second_reminder', fields.date_second_reminder)
    formData.set('date_sent_out', fields.date_sent_out)

    formData.set('amount', fields.amount)
    formData.set('exchange_rate', fields.exchange_rate)

    formData.delete('date_of_issuance_mask')
    formData.delete('date_first_reminder_mask')
    formData.delete('date_second_reminder_mask')
    formData.delete('date_sent_out_mask')

    formData.delete('amount_mask')
    formData.delete('exchange_rate_mask')

    onSubmit(formData, evt)
  }

  return (
    <FormDialog title={title} onSubmit={handleFormSubmit} {...dialogProps}>
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
      <DialogTabButtons
        current={tab}
        tabs={['Details', 'Amount']}
        onClick={setTab}
      />
      <DialogTabContent isCurrent={tab == 0}>
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
        <FieldSelect id="year" defaultValue={data?.year} label="Year" required>
          <option value="" disabled hidden></option>
          {yearOptions.map((year) => (
            <option
              key={year.value}
              className="text-primary"
              value={year.value}
            >
              {year.label}
            </option>
          ))}
        </FieldSelect>
        <FieldDateInput
          id="date_of_issuance"
          label="Date of issuance"
          value={fields.date_of_issuance}
          onChange={updateField('date_of_issuance')}
          required
        />
        <FieldDateInput
          id="date_sent_out"
          label="Sent out"
          value={fields.date_sent_out}
          onChange={updateField('date_sent_out')}
        />
        <FieldDateInput
          id="date_first_reminder"
          label="First reminder"
          value={fields.date_first_reminder}
          onChange={updateField('date_first_reminder')}
        />
        <FieldDateInput
          id="date_second_reminder"
          label="Second reminder"
          value={fields.date_second_reminder}
          onChange={updateField('date_second_reminder')}
        />
      </DialogTabContent>
      <DialogTabContent isCurrent={tab == 1}>
        <FieldFormattedNumberInput
          id="amount"
          label="Amount"
          step="any"
          value={fields.amount}
          onChange={updateField('amount')}
          required
        />
        <FieldInput
          id="currency"
          defaultValue={data?.currency}
          label="Currency"
          type="text"
          required
        />
        <FieldFormattedNumberInput
          id="exchange_rate"
          label="Exchange rate"
          step="any"
          value={fields.exchange_rate}
          onChange={updateField('exchange_rate')}
        />
        <h4>Upload</h4>
        <InvoiceAttachments oldFiles={data?.files_data} />
      </DialogTabContent>
    </FormDialog>
  )
}

export default InvoiceDialog

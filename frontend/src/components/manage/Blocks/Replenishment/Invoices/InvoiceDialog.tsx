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
import useGetCountryReplenishmentInfo from '@ors/components/manage/Blocks/Replenishment/useGetCountryReplenishmentInfo'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

import { InvoiceDialogProps } from './types'

interface TabContentProps {
  data: InvoiceDialogProps['data']
  fields: InvoiceDialogFields
  updateField: (
    name: string,
  ) => ChangeEventHandler<HTMLInputElement | HTMLSelectElement>
}

interface TabContentDetailsProps extends TabContentProps {
  countries: InvoiceDialogProps['countries']
}

function TabContentDetails(props: TabContentDetailsProps) {
  const { countries, data, fields, updateField } = props
  const ctx = useContext(ReplenishmentContext)
  const yearOptions = scAnnualOptions(ctx.periods)

  return (
    <>
      <FieldSelect
        id="country_id"
        label="Country"
        value={fields.country_id}
        onChange={updateField('country_id')}
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
        label="Inv ref."
        type="text"
        required
      />
      <FieldSelect
        id="year"
        label="Year"
        value={fields.year}
        onChange={updateField('year')}
        required
      >
        <option value="" disabled hidden></option>
        {yearOptions.map((year) => (
          <option key={year.value} className="text-primary" value={year.value}>
            {year.label}
          </option>
        ))}
      </FieldSelect>
      <FieldDateInput
        id="date_of_issuance"
        label="Invoice date"
        value={fields.date_of_issuance}
        onChange={updateField('date_of_issuance')}
        required
      />
      <FieldDateInput
        id="date_sent_out"
        label="Sent date"
        value={fields.date_sent_out}
        onChange={updateField('date_sent_out')}
      />
      <FieldDateInput
        id="date_first_reminder"
        label="1st reminder"
        value={fields.date_first_reminder}
        onChange={updateField('date_first_reminder')}
      />
      <FieldDateInput
        id="date_second_reminder"
        label="2nd reminder"
        value={fields.date_second_reminder}
        onChange={updateField('date_second_reminder')}
      />
    </>
  )
}
function TabContentAmount(props: TabContentProps) {
  const { data, fields, updateField } = props

  const ctx = useContext(ReplenishmentContext)

  const start_year = fields.year || ctx.periods?.[0].start_year || ''

  const [countryInfo] = useGetCountryReplenishmentInfo(
    start_year,
    fields.country_id,
  )

  return (
    <>
      <FieldInput
        id="currency"
        defaultValue={countryInfo?.currency}
        label="Currency"
        type="text"
        disabled
        readOnly
      />
      <FieldFormattedNumberInput
        id="currency"
        label={`"${countryInfo?.currency}" amount`}
        value={countryInfo?.amount_local_currency}
        disabled
        readOnly
      />
      <FieldFormattedNumberInput
        id="exchange_rate"
        label="Exchange rate"
        step="any"
        value={countryInfo?.exchange_rate}
        disabled
        readOnly
      />
      <FieldFormattedNumberInput
        id="amount"
        label="USD amount"
        value={countryInfo?.amount}
        disabled
        readOnly
      />
      <h4>Upload</h4>
      <InvoiceAttachments oldFiles={data?.files_data} />
    </>
  )
}

interface InvoiceDialogFields {
  amount: string
  country_id: string
  date_first_reminder: string
  date_of_issuance: string
  date_second_reminder: string
  date_sent_out: string
  exchange_rate: string
  year: string
}

const InvoiceDialog = function InvoiceDialog(props: InvoiceDialogProps) {
  const { countries, data, isEdit, onSubmit, title, ...dialogProps } = props

  const [tab, setTab] = useState(0)

  const [fields, setFields] = useState<InvoiceDialogFields>({
    amount: data?.amount ?? '',
    country_id: data?.country_id ?? '',
    date_first_reminder: data?.date_first_reminder ?? '',
    date_of_issuance: data?.date_of_issuance ?? '',
    date_second_reminder: data?.date_second_reminder ?? '',
    date_sent_out: data?.date_sent_out ?? '',
    exchange_rate: data?.exchange_rate ?? '',
    year: data?.year ?? '',
  })

  const updateField = useCallback(
    (name: string) => {
      const handler: ChangeEventHandler<
        HTMLInputElement | HTMLSelectElement
      > = (evt) => setFields((prev) => ({ ...prev, [name]: evt.target.value }))
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
        <TabContentDetails
          countries={countries}
          data={data}
          fields={fields}
          updateField={updateField}
        />
      </DialogTabContent>
      <DialogTabContent isCurrent={tab == 1}>
        <TabContentAmount
          data={data}
          fields={fields}
          updateField={updateField}
        />
      </DialogTabContent>
    </FormDialog>
  )
}

export default InvoiceDialog

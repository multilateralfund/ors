import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'

const InvoiceDialog = function InvoiceDialog(props) {
  const { columns, countries, data, title, ...dialogProps } = props

  return (
    <FormDialog title={title} {...dialogProps}>
      <FieldSelect id="iso3" defaultValue={data?.iso3} label="Country" required>
        <option value=""> - </option>
        {countries.map((c) => (
          <option key={c.iso3} value={c.iso3}>
            {c.name_alt}
          </option>
        ))}
      </FieldSelect>
      <FieldInput
        id="invoice_number"
        defaultValue={data?.invoice_number}
        label="Invoice number"
        type="text"
        required
      />
      <FieldInput
        id="period"
        defaultValue="2024-2026"
        label="Period"
        type="text"
        disabled
      />
      <FieldInput
        id="date"
        defaultValue={data?.date}
        label="Date"
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
        required
      />
      <FieldInput
        id="sent_on"
        defaultValue={data?.sent_on}
        label="Sent out"
        type="date"
        required
      />
      <FieldInput
        id="reminder"
        defaultValue={data?.reminder}
        label="Reminder"
        type="date"
        required
      />
      <h5>Files</h5>
      <InvoiceAttachments />
    </FormDialog>
  )
}

export default InvoiceDialog

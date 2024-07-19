import FormDialog from '@ors/components/manage/Blocks/Replenishment/FormDialog'
import {
  FieldInput,
  FieldSelect,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceAttachments from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceAttachments'

const InvoiceDialog = function InvoiceDialog(props) {
  const { columns, countries, data, title, ...dialogProps } = props

    console.log(data)

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
        id="number"
        defaultValue={data?.invoice_number}
        label="Invoice number"
        type="text"
        required
      />
      <FieldInput
        id="date"
        defaultValue={data?.date}
        label="Date"
        type="date"
        required
      />
      <FieldInput
        id="sent_out"
        defaultValue={data?.sent_on}
        label="Sent out"
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
      <h5>Files</h5>
      <InvoiceAttachments />
    </FormDialog>
  )
}

export default InvoiceDialog

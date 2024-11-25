import { ApiReplenishmentInvoice } from '@ors/types/api_replenishment_invoices'

function InvoiceStatus({ row }: { row: ApiReplenishmentInvoice }) {
  if (row.status === 'paid') {
    return <span className="rounded bg-mlfs-hlYellow p-1.5">PAID</span>
  } else if (row.status === 'partially_paid') {
    return <span className="rounded bg-[#F3F4F6] p-1.5">PARTIALLY PAID</span>
  } else if (row.id) {
    return <span className="rounded bg-[#F3F4F6] p-1.5">PENDING</span>
  } else {
    return <span className="rounded bg-[#F3F4F6] p-1.5">NOT ISSUED</span>
  }
}

export default InvoiceStatus

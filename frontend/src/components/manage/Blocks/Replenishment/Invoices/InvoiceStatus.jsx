function InvoiceStatus({ row }) {
  if (row.date_paid) {
    return <span className="rounded bg-mlfs-hlYellow p-1.5">PAID</span>
  } else if (row.id) {
    return <span className="rounded bg-[#F3F4F6] p-1.5">PENDING</span>
  } else {
    return <span className="rounded bg-[#F3F4F6] p-1.5">NOT ISSUED</span>
  }
}

export default InvoiceStatus

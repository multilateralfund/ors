function InvoiceStatus({ status }) {
  if (status) {
    return <span className="rounded bg-mlfs-hlYellow p-1.5">PAID</span>
  } else {
    return <span className="rounded bg-[#F3F4F6] p-1.5">PENDING</span>
  }
}

export default InvoiceStatus

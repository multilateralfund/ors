'use client'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'date', label: 'Date' },
  { field: 'sent_out', label: 'Sent out' },
  { field: 'amount', label: 'Amount' },
  { field: 'number', label: 'Number' },
]

const DATA = [
  {
    amount: '123,123,123.123',
    country: 'Finland',
    date: '17-MAY-2023',
    iso3: 'FIN',
    number: '40-MFL-FIN',
    sent_out: '18-MAY-2023',
  },
]

export default function SCSummary() {
  return <div>Table</div>
}

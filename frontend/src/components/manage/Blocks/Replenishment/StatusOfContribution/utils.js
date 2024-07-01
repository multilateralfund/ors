export const SC_COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'agreed_contributions', label: 'Agreed Contributions' },
  { field: 'cash_payments', label: 'Cash Payments' },
  { field: 'bilateral_assisstance', label: 'Bilateral Assistance' },
  { field: 'promissory_notes', label: 'Promissory Notes' },
  { field: 'outstanding_contributions', label: 'Outstanding Contribution' },
]

export const mockScAnnualOptions = () => {
  const options = []
  for (let i = 2023; i >= 1991; i--) {
    options.push({ label: i.toString(), value: i.toString() })
  }

  return options
}

export function transformData(data) {
  const rows = []

  for (let i = 0; i < data.length; i++) {
    rows.push({
      agreed_contributions: data[i].agreed_contributions,
      bilateral_assisstance: data[i].bilateral_assisstance,
      cash_payments: data[i].cash_payments,
      country: data[i].country.name_alt,
      gain_loss: data[i].gain_loss,
      outstanding_contributions: data[i].outstanding_contributions,
      promissory_notes: data[i].promissory_notes,
    })
  }

  return rows
}

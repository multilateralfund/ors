import { PERIOD } from './constants'
import styles from './table.module.css'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'date', label: 'Date' },
  { field: 'amount_usd', label: 'Amount (USD)' },
  { field: 'amount_national', label: 'Amount (national currency)' },
  { field: 'gain_loss', label: 'Gain / Loss' },
  { field: 'acknowledged', label: 'Acknowledged' },
  { field: 'promissory_note', label: 'Promissory note' },
]

const DATA: any[] = [
  {
    acknowledged: 'Yes',
    amount_national: '1,300,000.0000',
    amount_usd: '1,000,000.0000',
    country: 'Finland',
    date: '17-MAY-2022',
    gain_loss: '100,000.0000',
    promissory_note: 'No',
  },
  {
    acknowledged: 'No',
    amount_national: '1,300,000.0000',
    amount_usd: '1,000,000.0000',
    country: 'Finland',
    date: '17-MAY-2023',
    gain_loss: '-100,000.0000',
    promissory_note: 'Yes',
  },
]

function InvoicesTableView(props: any) {
  const period = props.period ?? PERIOD

  const hCols = []
  for (let i = 0; i < COLUMNS.length; i++) {
    hCols.push(<th key={i}>{COLUMNS[i].label.replace('[PERIOD]', period)}</th>)
  }

  const rows = []
  for (let j = 0; j < DATA.length * 23; j++) {
    const row = []
    for (let i = 0; i < COLUMNS.length; i++) {
      row.push(<td key={i}>{DATA[j % DATA.length][COLUMNS[i].field]}</td>)
    }
    rows.push(<tr key={j}>{row}</tr>)
  }

  return (
    <table className={styles.replTable}>
      <thead>
        <tr>{hCols}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

export default InvoicesTableView

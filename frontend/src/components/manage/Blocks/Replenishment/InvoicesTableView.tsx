import { PERIOD } from './constants'
import styles from './table.module.css'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'date', label: 'Date' },
  { field: 'sent_out', label: 'Sent out' },
  { field: 'number', label: 'Number' },
]

const DATA: any[] = [
  {
    country: 'Finland',
    date: '17-MAY-2023',
    number: '40-MFL-FIN',
    sent_out: '18-MAY-2023',
  },
]

function InvoicesTableView(props: any) {
  const period = props.period ?? PERIOD

  const hCols = []
  for (let i = 0; i < COLUMNS.length; i++) {
    hCols.push(<th key={i}>{COLUMNS[i].label.replace('[PERIOD]', period)}</th>)
  }

  const rows = []
  for (let j = 0; j < DATA.length * 49; j++) {
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

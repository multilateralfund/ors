import { PERIOD } from './constants'
import styles from './table.module.css'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  {
    field: 'un_soa',
    label: 'United Nations scale of assessment for the period [PERIOD]',
  },
  {
    field: 'adj_un_soa',
    label:
      'Adjusted UN Scale of Assessment using [PERIOD] scale with no party contributing more than 22%',
  },
  {
    field: 'annual_contributions',
    label: 'Annual contributions for years [PERIOD] in (United States Dollar)',
  },
  {
    field: 'avg_ir',
    label: 'Average inflation rate for the period [PERIOD] (percent)**',
  },
  {
    field: 'qual_ferm',
    label: 'Qualifying for fixed exchange rate mechanism, use 1=Yes, 0=No',
  },
  {
    field: 'ferm_rate',
    label:
      "Fixed exchange rate mechanism users' currencies rate of Exchange 01 Jan - 30 June 2023***",
  },
  {
    field: 'ferm_cur',
    label: 'Fixed exchange mechanism users national currencies',
  },
  {
    field: 'ferm_cur_amount',
    label:
      'Fixed exchange mechanism users contribution amount in national currencies',
  },
]

const DATA: any[] = [
  {
    adj_un_soa: 0.5286,
    annual_contributions: 1000000,
    avg_ir: 9.774,
    country: 'Romania',
    ferm_cur: 'Romanian LEU',
    ferm_cur_amount: 4556580,
    ferm_rate: 4.55658,
    qual_ferm: 1,
    un_soa: 0.312,
  },
]

function ReplenishmentTableView(props: any) {
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

export default ReplenishmentTableView

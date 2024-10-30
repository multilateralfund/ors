import { SATableColumn } from '@ors/components/manage/Blocks/Replenishment/SAView/types'
import { asDecimal } from '@ors/components/manage/Blocks/Replenishment/utils'

const COLUMNS: SATableColumn[] = [
  { field: 'country', label: 'Country' },
  {
    editable: true,
    field: 'un_soa',
    label: 'UN scale of assessment *',
    parser: asDecimal,
    subLabel: '( [UN_SCALE_PERIOD] )',
  },
  {
    confirmationText:
      'If you make this change, this value will be fixed and all other values except for the USA will be changed accordingly.',
    editable: true,
    field: 'adj_un_soa',
    label: 'Adjusted UN Scale of Assessment',
    parser: asDecimal,
    validator: function (value) {
      if (value > 22) {
        return "Value can't be greater than 22."
      }
    },
  },
  {
    field: 'annual_contributions',
    label: 'Annual contributions',
    subLabel: '([PERIOD] in USD)',
  },
  {
    editable: true,
    field: 'avg_ir',
    label: 'Average inflation rate **',
    parser: asDecimal,
    subLabel: '( [PREV_PERIOD] )',
  },
  {
    editOptions: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
    editParser: function (v) {
      return v ? v.toString() : 'false'
    },
    // editWidget: 'select',
    // editable: true,
    field: 'qual_ferm',
    label: 'Qualifying for fixed exchange rate mechanism',
    parser: function (v) {
      return v === 'true' || v === 't' || v === 'y' || v === '1'
    },
    subLabel: '(Yes / No)',
  },
  {
    className: 'print:hidden',
    editOptions: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
    editParser: function (v) {
      return v.toString()
    },
    editWidget: 'select',
    editable: true,
    field: 'opted_for_ferm',
    label: 'Opted for fixed exchange rate mechanism',
    parser: function (v) {
      return v === 'true' || v === 't' || v === 'y' || v === '1'
    },
    subLabel: '(Yes / No)',
  },
  {
    editable: true,
    field: 'ferm_rate',
    label: 'Currency rate of exchange used for fixed exchange ***',
    parser: asDecimal,
    subLabel: '[DATE_RANGE]',
  },
  {
    editable: true,
    field: 'ferm_cur',
    label: 'National currency used for fixed exchange',
  },
  {
    field: 'ferm_cur_amount',
    label: 'Contribution amount in national currencies',
    subLabel: '(for fixed exchange mechanism)',
  },
]

export default COLUMNS

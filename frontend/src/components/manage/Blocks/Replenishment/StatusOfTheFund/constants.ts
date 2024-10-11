import {
  IALLOCATIONS,
  IINCOME,
  IPROVISIONS,
} from '../Dashboard/useGetDashboardDataTypes'

export const incomeOrder: (keyof IINCOME)[] = [
  'cash_payments',
  'promissory_notes',
  'bilateral_assistance',
  'interest_earned',
  'miscellaneous_income',
]

export const allocationsOrder: (keyof IALLOCATIONS)[] = [
  'undp',
  'unep',
  'unido',
  'world_bank',
]

export const provisionsOrder: (keyof IPROVISIONS)[] = [
  'staff_contracts',
  'treasury_fees',
  'monitoring_fees',
  'technical_audit',
  'information_strategy',
  'bilateral_assistance',
  'gain_loss',
]

export const quarterOptions = [
  { label: 'I', value: 'I' },
  { label: 'II', value: 'II' },
  { label: 'III', value: 'III' },
  { label: 'IV', value: 'IV' },
]

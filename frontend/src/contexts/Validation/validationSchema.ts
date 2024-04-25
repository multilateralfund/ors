import type { ValidationSchema } from './types'

import {
  validateAnnexENonQPS,
  validateBannedImports,
  validateTotals,
} from './validators'
import { validateAnnexEQPS } from './validators'

const validationSchema: ValidationSchema = {
  section_a: {
    rows: [
      {
        id: 'validate-totals',
        highlight_cells: { remarks: (row) => !row.remarks },
        message:
          'Total "Use by Sector" should be equal to Import-Export+Production. Otherwise, explanation is required for all substances in the "Remarks" column',
        validator: validateTotals,
      },
      {
        id: 'validate-annex-e-qps',
        highlight_cells: {
          banned_date: (row) => !row.banned_date,
          remarks: (row) => !row.remarks,
        },
        message:
          'The sum of these 2 fields ("QPS" + "Non-QPS") should be equal to "import". Otherwise, they should fill in the Remarks field.',
        validator: validateAnnexEQPS,
      },
      {
        id: 'validate-annex-e-non-qps',
        highlight_cells: {
          banned_date: (row) => !row.banned_date,
          remarks: (row) => !row.remarks,
        },
        message:
          'If Non-QPS is filled in, users must put a date and fill in the Remarks field',
        validator: validateAnnexENonQPS,
      },
      {
        id: 'validate-banned-imports',
        highlight_cells: {
          banned_date: (row) => !row.banned_date,
        },
        message:
          'In the case where imports of a specific controlled substance are banned, the date of the ban should be provided',
        validator: validateBannedImports,
      },
    ],
  },
  section_b: {
    rows: [
      {
        id: 'validate-totals',
        highlight_cells: { remarks: (row) => !row.remarks },
        message:
          'Total "Use by Sector" should be equal to Import-Export+Production. Otherwise, explanation is required for all substances in the "Remarks" column',
        validator: validateTotals,
      },
    ],
  },
}

export default validationSchema

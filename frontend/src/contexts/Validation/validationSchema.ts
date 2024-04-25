import type { ValidationSchema } from './types'

import { validateTotals } from './validators'
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
        id: 'validate-qps-annex-e',
        highlight_cells: { remarks: (row) => !row.remarks },
        message:
          'The sum of these 2 fields ("QPS" + "Non-QPS") should be equal to "import". Otherwise, they should fill in the Remarks field.',
        validator: validateAnnexEQPS,
      },
    ],
  },
}

export default validationSchema

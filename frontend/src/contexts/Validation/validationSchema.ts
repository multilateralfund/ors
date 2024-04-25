import type { ValidationSchema } from './types'

import { validateTotals } from './validators'

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
    ],
  },
}

export default validationSchema
